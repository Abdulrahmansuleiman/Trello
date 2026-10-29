// Client side of the board sync.
//
// Rules this file exists to enforce:
//  1. A card never jumps back. A read is only accepted when its revision is
//     newer than the one we already applied, so a slow or repeated read can not
//     repaint an older board.
//  2. A change is never lost. Every change is an operation, kept in a queue that
//     survives a refresh, resent until the server confirms it, and replayed on
//     top of the newest revision if somebody else wrote in between.
//  3. A failed save is never silent. The UI shows "Not saved" until it lands.

import { useCallback, useEffect, useRef, useState } from 'react'
import { applyOp, applyOps } from '../../shared/ops.js'
import { loadState, saveState } from './storage.js'
import { makeInitialState, ensureLists, sanitizeState } from './seed.js'

const CACHE_KEY = 'launchops-trello-board-v2'
const QUEUE_KEY = 'launchops-board-queue-v1'
const POLL_MS = 6000
const BATCH_MS = 60

export const normalize = (s) =>
  s && Array.isArray(s.lists) ? sanitizeState(ensureLists(s)) : s

function loadQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((op) => op && op.type) : []
  } catch {
    return []
  }
}

function saveQueue(ops) {
  try {
    if (!ops.length) localStorage.removeItem(QUEUE_KEY)
    else localStorage.setItem(QUEUE_KEY, JSON.stringify(ops))
  } catch {
    /* ignore quota errors */
  }
}

async function readRemote() {
  const r = await fetch('/api/board', { cache: 'no-store' })
  if (!r.ok) throw new Error(`read failed ${r.status}`)
  const j = await r.json()
  if (!j || !j.ok) throw new Error((j && j.error) || 'read failed')
  return { rev: Number(j.rev) || 0, state: j.state || null }
}

async function postOps(ops) {
  const r = await fetch('/api/board', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ops }),
  })
  const j = await r.json().catch(() => null)
  if (!r.ok || !j || !j.ok) {
    const err = new Error((j && j.error) || `save failed ${r.status}`)
    err.empty = Boolean(j && j.empty)
    throw err
  }
  return j
}

async function postInit(state) {
  const r = await fetch('/api/board', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ init: state }),
  })
  const j = await r.json().catch(() => null)
  if (!r.ok || !j || !j.ok) throw new Error((j && j.error) || 'seed failed')
  return j
}

export default function useBoardSync() {
  const initialRef = useRef(null)
  if (initialRef.current === null) {
    initialRef.current = normalize(loadState(CACHE_KEY, makeInitialState()))
  }

  const [state, setState] = useState(initialRef.current)
  const [status, setStatus] = useState('loading')
  const [rev, setRev] = useState(0)

  const stateRef = useRef(initialRef.current)
  const revRef = useRef(0)
  const queueRef = useRef([])
  const inflightRef = useRef(false)
  const timerRef = useRef(null)
  const triesRef = useRef(0)
  const aliveRef = useRef(true)
  const readyRef = useRef(false)

  const publish = useCallback((next) => {
    stateRef.current = next
    setState(next)
    saveState(CACHE_KEY, next)
  }, [])

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      flushRef.current()
    }, BATCH_MS)
  }, [])

  const flush = useCallback(async () => {
    if (inflightRef.current || !aliveRef.current) return
    const ops = queueRef.current
    if (!ops.length) {
      setStatus('saved')
      return
    }

    inflightRef.current = true
    setStatus('saving')

    let failed = false
    try {
      const res = await postOps(ops)
      // Anything queued while the request was in flight stays waiting.
      queueRef.current = queueRef.current.slice(ops.length)
      saveQueue(queueRef.current)

      revRef.current = Number(res.rev) || revRef.current
      setRev(revRef.current)
      publish(normalize(res.state))
      triesRef.current = 0
    } catch (e) {
      failed = true
      if (e && e.empty) {
        // The store was reset underneath us. Re-seed from what we have; the
        // ops stay queued and are re-applied on the next attempt.
        try {
          const seeded = await postInit(stateRef.current)
          revRef.current = Number(seeded.rev) || 1
          setRev(revRef.current)
        } catch {
          /* retried below */
        }
      }
    }

    inflightRef.current = false

    if (!aliveRef.current) return

    if (failed) {
      setStatus('error')
      triesRef.current += 1
      const delay = Math.min(15000, 500 * 2 ** Math.min(triesRef.current, 5))
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        flushRef.current()
      }, delay)
      return
    }

    if (queueRef.current.length) {
      setStatus('saving')
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        flushRef.current()
      }, BATCH_MS)
      return
    }

    setStatus('saved')
  }, [publish])

  const flushRef = useRef(flush)
  useEffect(() => {
    flushRef.current = flush
  }, [flush])

  // Push a change. Applied to the screen immediately, then sent as an operation.
  const run = useCallback(
    (op) => {
      const next = applyOp(stateRef.current, op)
      if (next === stateRef.current) return next

      publish(next)
      queueRef.current = [...queueRef.current, op]
      saveQueue(queueRef.current)

      if (readyRef.current) {
        setStatus('saving')
        scheduleFlush()
      }
      return next
    },
    [publish, scheduleFlush]
  )

  const replace = useCallback(
    (next) => {
      publish(normalize(next))
    },
    [publish]
  )

  const retryNow = useCallback(() => {
    triesRef.current = 0
    flushRef.current()
  }, [])

  // Boot: take the server copy, replay anything saved before a refresh, seed an
  // empty store.
  useEffect(() => {
    aliveRef.current = true
    queueRef.current = loadQueue()

    ;(async () => {
      try {
        const remote = await readRemote()
        if (!aliveRef.current) return

        if (!remote.state) {
          const seeded = await postInit(normalize(makeInitialState()))
          revRef.current = Number(seeded.rev) || 1
          setRev(revRef.current)
          publish(normalize(seeded.state))
        } else {
          revRef.current = remote.rev
          setRev(remote.rev)
          const base = normalize(remote.state)
          publish(queueRef.current.length ? normalize(applyOps(base, queueRef.current)) : base)
        }
        readyRef.current = true
        setStatus(queueRef.current.length ? 'saving' : 'saved')
        if (queueRef.current.length) flushRef.current()
      } catch {
        if (!aliveRef.current) return
        readyRef.current = true
        setStatus('error')
        triesRef.current = 1
        timerRef.current = setTimeout(() => {
          timerRef.current = null
          // Retry hydration, then push whatever is waiting.
          readRemote()
            .then((remote) => {
              if (!remote.state) return
              if (remote.rev < revRef.current) return
              revRef.current = remote.rev
              setRev(remote.rev)
              publish(normalize(applyOps(normalize(remote.state), queueRef.current)))
              setStatus('saved')
              flushRef.current()
            })
            .catch(() => {})
        }, 4000)
      }
    })()

    return () => {
      aliveRef.current = false
    }
  }, [publish])

  // Refresh from other browsers and from the agent, but only when we have
  // nothing unsaved and only when the revision actually moved forward.
  const pullOnce = useCallback(async () => {
    if (!readyRef.current || inflightRef.current || queueRef.current.length) return
    try {
      const remote = await readRemote()
      if (!remote.state) return
      if (remote.rev <= revRef.current) return
      revRef.current = remote.rev
      setRev(remote.rev)
      publish(normalize(remote.state))
      setStatus('saved')
    } catch {
      /* transient, the next tick retries */
    }
  }, [publish])

  useEffect(() => {
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      pullOnce()
    }, POLL_MS)
    return () => clearInterval(id)
  }, [pullOnce])

  // Coming back to a tab should show the current board straight away.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') pullOnce()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [pullOnce])

  // Never lose a drag because the page is closing.
  useEffect(() => {
    const send = () => {
      const ops = queueRef.current
      if (!ops.length || typeof navigator === 'undefined' || !navigator.sendBeacon) return
      try {
        navigator.sendBeacon('/api/board', new Blob([JSON.stringify({ ops })], { type: 'application/json' }))
      } catch {
        /* nothing else we can do here */
      }
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') send()
    }
    window.addEventListener('pagehide', send)
    window.addEventListener('beforeunload', send)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', send)
      window.removeEventListener('beforeunload', send)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])

  return {
    state,
    rev,
    status,
    pending: queueRef.current.length,
    run,
    replace,
    retryNow,
    ready: readyRef.current,
  }
}
