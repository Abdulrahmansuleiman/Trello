// Board sync verification.
//
//   node scripts/verify-board.mjs local    # full suite against a scratch board row
//   node scripts/verify-board.mjs live     # end to end against the deployed API
//
// The live run only touches a card it creates and deletes itself, so it is safe
// to point at production.

import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')

function loadEnvFile(file) {
  try {
    const raw = readFileSync(file, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const value = m[2].replace(/^["']|["']$/g, '')
      if (!process.env[m[1]]) process.env[m[1]] = value
    }
  } catch {
    /* optional */
  }
}

loadEnvFile(path.join(ROOT, '.env'))
loadEnvFile(path.resolve(ROOT, '..', '.env'))

process.env.CRON_SECRET = process.env.CRON_SECRET || 'local-verify-secret'

const mode = process.argv[2] || 'local'
const LIVE = 'https://trello.launchopsai.click'

let pass = 0
let fail = 0

function check(name, ok, detail = '') {
  if (ok) {
    pass += 1
    console.log(`  PASS  ${name}`)
  } else {
    fail += 1
    console.log(`  FAIL  ${name}${detail ? `  -> ${detail}` : ''}`)
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------------------
// transport
// ---------------------------------------------------------------------------

function makeLocalTransport() {
  return async (method, body, query = {}, headers = {}) => {
    const mod = await import(pathToFileURL(path.join(ROOT, 'api', 'board.js')).href)
    const handler = mod.default
    const req = { method, body, query, headers }
    let statusCode = 200
    let payload = null
    const res = {
      setHeader() {},
      status(code) {
        statusCode = code
        return res
      },
      json(data) {
        payload = data
        return res
      },
    }
    await handler(req, res)
    return { status: statusCode, body: payload }
  }
}

function makeLiveTransport() {
  return async (method, body, query = {}, headers = {}) => {
    const qs = new URLSearchParams(query).toString()
    const url = `${LIVE}/api/board${qs ? `?${qs}` : ''}`
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })
    const text = await res.text()
    let parsed = null
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = { raw: text.slice(0, 200) }
    }
    return { status: res.status, body: parsed }
  }
}

// ---------------------------------------------------------------------------
// local suite: scratch board row, atomic writes, idempotency, history
// ---------------------------------------------------------------------------

const FIXTURE = {
  board: { title: 'Verify Board', starred: false },
  members: [],
  lists: [
    {
      id: 'list-a',
      title: 'A',
      cards: [
        { id: 'card-1', title: 'one', labels: [], members: [], desc: '', checklist: [], comments: [] },
        { id: 'card-2', title: 'two', labels: [], members: [], desc: '', checklist: [], comments: [] },
        { id: 'card-3', title: 'three', labels: [], members: [], desc: '', checklist: [], comments: [] },
      ],
    },
    { id: 'list-b', title: 'B', cards: [] },
  ],
}

const countCards = (state) => state.lists.reduce((n, l) => n + l.cards.length, 0)
const listOf = (state, cardId) => (state.lists.find((l) => l.cards.some((c) => c.id === cardId)) || {}).id

async function localSuite() {
  const call = makeLocalTransport()
  const TEST_ID = 2
  const auth = { authorization: `Bearer ${process.env.CRON_SECRET}` }
  const post = (ops) => call('POST', { boardId: TEST_ID, ops }, {}, auth)
  const get = () => call('GET', null, { boardId: String(TEST_ID) }, auth)

  console.log('\nLocal suite (scratch board %d)\n', TEST_ID)

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (url && key) {
    const headers = { apikey: key, Authorization: `Bearer ${key}` }
    await fetch(`${url}/rest/v1/board_state?id=eq.${TEST_ID}`, { method: 'DELETE', headers })
    await fetch(`${url}/rest/v1/board_history?board_id=eq.${TEST_ID}`, { method: 'DELETE', headers })
  }

  const seed = await call('POST', { boardId: TEST_ID, init: FIXTURE }, {}, auth)
  check('seed scratch board', seed.status === 200 && seed.body.ok, JSON.stringify(seed.body).slice(0, 160))

  let read = await get()
  check('read returns a revision', read.status === 200 && typeof read.body.rev === 'number')

  // 1. a move sticks
  let state = read.body.state
  const beforeMove = listOf(state, 'card-1')
  const moved = await post([{ type: 'move', cardId: 'card-1', toListId: 'list-b', beforeCardId: null }])
  check('move accepted', moved.status === 200 && moved.body.ok, JSON.stringify(moved.body).slice(0, 160))
  read = await get()
  check('move is stored', listOf(read.body.state, 'card-1') === 'list-b', `${beforeMove} -> ${listOf(read.body.state, 'card-1')}`)

  await sleep(700)
  read = await get()
  check('move still there after a delay', listOf(read.body.state, 'card-1') === 'list-b')

  // 2. a stale writer can not undo it
  const staleMove = await post([{ type: 'move', cardId: 'card-2', toListId: 'list-b', beforeCardId: null }])
  check('stale writer accepted', staleMove.status === 200 && staleMove.body.ok)
  read = await get()
  check('both moves survived', listOf(read.body.state, 'card-1') === 'list-b' && listOf(read.body.state, 'card-2') === 'list-b')
  check('no card lost', countCards(read.body.state) === 3, `count=${countCards(read.body.state)}`)

  // 3. concurrent writes do not clobber each other
  const [a, b] = await Promise.all([
    post([{ type: 'move', cardId: 'card-3', toListId: 'list-b', beforeCardId: null }]),
    post([{ type: 'updateCard', cardId: 'card-1', patch: { title: 'one edited' } }]),
  ])
  check('concurrent writes both accepted', a.body.ok && b.body.ok, `${a.status}/${b.status}`)
  read = await get()
  check('concurrent move kept', listOf(read.body.state, 'card-3') === 'list-b')
  check(
    'concurrent edit kept',
    read.body.state.lists.some((l) => l.cards.some((c) => c.id === 'card-1' && c.title === 'one edited'))
  )

  // 4. delete sticks and does not come back
  const del = await post([{ type: 'deleteCard', cardId: 'card-2' }])
  check('delete accepted', del.status === 200 && del.body.ok)
  read = await get()
  check('card stays deleted', !read.body.state.lists.some((l) => l.cards.some((c) => c.id === 'card-2')))
  await sleep(700)
  read = await get()
  check('card still deleted after a delay', !read.body.state.lists.some((l) => l.cards.some((c) => c.id === 'card-2')))

  // 5. retries are idempotent
  const again = await post([{ type: 'deleteCard', cardId: 'card-2' }])
  read = await get()
  const totalAfterRepeat = countCards(read.body.state)
  check('repeated delete is harmless', again.status === 200 && totalAfterRepeat === 2, `count=${totalAfterRepeat}`)

  const dupAdd = [
    { type: 'addCard', listId: 'list-a', card: { id: 'card-dup', title: 'dup', labels: [], members: [], desc: '', checklist: [], comments: [] } },
  ]
  await post(dupAdd)
  await post(dupAdd)
  read = await get()
  check('repeated add creates one card', read.body.state.lists.reduce((n, l) => n + l.cards.filter((c) => c.id === 'card-dup').length, 0) === 1)

  await post([{ type: 'deleteCard', cardId: 'card-dup' }])

  // 6. whole snapshots are refused
  const snapshot = await call('POST', { boardId: TEST_ID, state: FIXTURE }, {}, auth)
  check('whole board snapshot refused', snapshot.status === 409, `status=${snapshot.status}`)

  // 7. history + restore
  const hist = await call('GET', null, { boardId: String(TEST_ID), history: '1', limit: '10' }, auth)
  check('history is recorded', hist.status === 200 && Array.isArray(hist.body.revisions) && hist.body.revisions.length > 3, `n=${hist.body.revisions && hist.body.revisions.length}`)

  const revisions = hist.body.revisions || []
  const oldRev = revisions[revisions.length - 1] && revisions[revisions.length - 1].rev
  if (oldRev != null) {
    const restored = await call('POST', { boardId: TEST_ID, restoreRev: Number(oldRev) }, {}, auth)
    check('restore works', restored.status === 200 && restored.body.ok, JSON.stringify(restored.body).slice(0, 160))
  }

  // leave the scratch row usable next run
  const fresh = await call('POST', { boardId: TEST_ID, restoreRev: Number(read.body.rev) }, {}, auth)
  check('restore forward works', fresh.status === 200)
}

// ---------------------------------------------------------------------------
// live suite: proves the deployed board keeps a move and a delete
// ---------------------------------------------------------------------------

async function liveSuite() {
  const call = makeLiveTransport()
  const get = () => call('GET')
  const post = (ops) => call('POST', { ops })
  const title = `SYNC TEST ${Date.now().toString(36)}`

  console.log('\nLive suite (%s)\n', LIVE)

  const start = await get()
  check('live read ok', start.status === 200 && start.body.ok, `status=${start.status}`)
  if (!start.status || start.status !== 200) return

  const startState = start.body.state
  const startCount = countCards(startState)
  const ideas = startState.lists[0]
  const secondList = startState.lists[1]

  const added = await post([
    { type: 'addCard', listId: ideas.id, card: { id: `card-verify-${Date.now().toString(36)}`, title, labels: [], members: [], desc: '', checklist: [], comments: [] } },
  ])
  check('add card accepted', added.status === 200 && added.body.ok, JSON.stringify(added.body).slice(0, 160))
  const cardId = added.body.state.lists.flatMap((l) => l.cards).find((c) => c.title === title).id

  await sleep(1500)
  let read = await get()
  check('added card survives a reload', read.body.state.lists.some((l) => l.cards.some((c) => c.id === cardId)))

  const moved = await post([{ type: 'move', cardId, toListId: secondList.id, beforeCardId: null }])
  check('move accepted', moved.status === 200 && moved.body.ok, JSON.stringify(moved.body).slice(0, 160))

  await sleep(1500)
  read = await get()
  check('move survives a reload', listOf(read.body.state, cardId) === secondList.id, `in ${listOf(read.body.state, cardId)}`)

  await sleep(3000)
  read = await get()
  check('move still there 3s later', listOf(read.body.state, cardId) === secondList.id)

  const deleted = await post([{ type: 'deleteCard', cardId }])
  check('delete accepted', deleted.status === 200 && deleted.body.ok)
  await sleep(1200)
  read = await get()
  check('delete survives a reload', !read.body.state.lists.some((l) => l.cards.some((c) => c.id === cardId)))
  check('card count back to start', countCards(read.body.state) === startCount, `${startCount} -> ${countCards(read.body.state)}`)
}

if (mode === 'live') await liveSuite()
else await localSuite()

console.log(`\n${pass} passed, ${fail} failed\n`)
if (fail) process.exit(1)
