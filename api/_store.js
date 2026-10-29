// Board store: Supabase Postgres, single row per board, versioned with an
// atomic compare and set.
//
// Why this and not the old Global Config blob:
// Global Config writes take up to 10 seconds to propagate, so a client could
// read the old board right after saving and jump back to it. Postgres reads
// are immediately consistent, and `board_commit` only succeeds when the revision
// matches, so a stale writer can never overwrite newer work. Every revision is
// also copied into `board_history`, so no change is ever unrecoverable.

import { applyOps, isValidState } from '../shared/ops.js'

const RAW_URL = (process.env.BOARD_SUPABASE_URL || process.env.SUPABASE_URL || '').trim()
const RAW_KEY = (
  process.env.BOARD_SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  ''
).trim()

const URL_BASE = RAW_URL.replace(/\/+$/, '')
const API_KEY = RAW_KEY

export const DEFAULT_BOARD_ID = 1
const MAX_ATTEMPTS = 8

export function storeReady() {
  return Boolean(URL_BASE && API_KEY)
}

export function storeInfo() {
  return {
    driver: 'supabase-postgres',
    configured: storeReady(),
    host: URL_BASE ? URL_BASE.replace(/^https?:\/\//, '').split('.')[0] : null,
  }
}

async function rpcRows(fn, args) {
  const r = await fetch(`${URL_BASE}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: API_KEY,
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(args),
    cache: 'no-store',
  })

  if (!r.ok) {
    const text = await r.text()
    throw new Error(`supabase ${fn} failed: ${r.status} ${text.slice(0, 300)}`)
  }

  const json = await r.json()
  if (Array.isArray(json)) return json
  return json == null ? [] : [json]
}

async function rpc(fn, args) {
  const rows = await rpcRows(fn, args)
  return rows[0] || null
}

export async function readBoard(boardId = DEFAULT_BOARD_ID) {
  const row = await rpc('board_get', { p_id: boardId })
  if (!row) return null
  return { rev: Number(row.rev) || 0, state: row.state || null }
}

export async function initBoard(state, boardId = DEFAULT_BOARD_ID) {
  if (!isValidState(state)) throw new Error('invalid board state')
  const row = await rpc('board_init', { p_state: state, p_id: boardId })
  return { rev: Number(row.rev) || 0, state: row.state }
}

// Apply operations to the newest stored revision and save atomically.
// A concurrent writer bumps the revision before we can, `board_commit` returns
// ok:false, and we simply re-read and re-apply. Because every operation is
// absolute (move card X into list Y, delete card Z) re-applying is safe and no
// write is ever dropped.
export async function commitOps(ops, boardId = DEFAULT_BOARD_ID) {
  const clean = Array.isArray(ops) ? ops.filter((o) => o && o.type) : []
  if (!clean.length) {
    const current = await readBoard(boardId)
    return { ok: true, applied: 0, rev: current ? current.rev : 0, state: current ? current.state : null }
  }

  let last = null

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const snapshot = await readBoard(boardId)
    if (!snapshot || !snapshot.state) {
      return { ok: false, empty: true, error: 'board store is empty' }
    }

    const next = applyOps(snapshot.state, clean)
    const res = await rpc('board_commit', {
      p_base_rev: snapshot.rev,
      p_state: next,
      p_ops: clean,
      p_id: boardId,
    })

    if (res && res.ok) {
      return {
        ok: true,
        applied: clean.length,
        rev: Number(res.rev) || snapshot.rev + 1,
        state: res.state,
        attempts: attempt + 1,
      }
    }

    last = res
  }

  return {
    ok: false,
    conflict: true,
    error: 'board is busy, could not save',
    rev: last ? Number(last.rev) || 0 : 0,
    state: last ? last.state : null,
  }
}

export async function restoreRev(rev, boardId = DEFAULT_BOARD_ID) {
  const res = await rpc('board_restore', { p_rev: rev, p_id: boardId })
  if (!res) return { ok: false, error: 'revision not found' }
  return { ok: Boolean(res.ok), rev: Number(res.rev) || 0, state: res.state }
}

export async function history(boardId = DEFAULT_BOARD_ID, limit = 20) {
  return rpcRows('board_history_list', { p_id: boardId, p_limit: limit })
}

export async function pruneHistory(boardId = DEFAULT_BOARD_ID, keep = 500) {
  const n = await rpc('board_prune', { p_keep: keep, p_id: boardId })
  return Number(n) || 0
}
