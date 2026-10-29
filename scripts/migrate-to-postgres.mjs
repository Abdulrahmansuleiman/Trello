// One off: copy the live board from the old Global Config store into the
// Postgres store, and put back any card that the old bug deleted.
//
//   node scripts/migrate-to-postgres.mjs [sourceUrl] [snapshotJson]
//
// It is idempotent: a second run finds the Postgres row already seeded and
// only re-adds cards that are still missing.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')

function loadEnvFile(file) {
  try {
    const raw = readFileSync(file, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    /* optional */
  }
}

loadEnvFile(path.join(ROOT, '.env'))
loadEnvFile(path.resolve(ROOT, '..', '.env'))

const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '')
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing')

const source = process.argv[2] || 'https://trello.launchopsai.click/api/board'
const snapshotPath = process.argv[3]

async function rpc(fn, args) {
  const r = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  if (!r.ok) throw new Error(`${fn}: ${r.status} ${await r.text()}`)
  const j = await r.json()
  return Array.isArray(j) ? j[0] || null : j
}

const allCards = (state) =>
  state.lists.flatMap((l) => l.cards.map((c) => ({ ...c, listId: l.id })))

async function main() {
  const live = await (await fetch(source, { cache: 'no-store' })).json()
  if (!live || !live.state) throw new Error('no live board returned')
  const state = live.state

  // Cards that existed in the captured snapshot but are gone from the live board.
  let recovered = []
  if (snapshotPath) {
    const snap = JSON.parse(readFileSync(snapshotPath, 'utf8')).state
    const liveIds = new Set(allCards(state).map((c) => c.id))
    for (const card of allCards(snap)) {
      if (!liveIds.has(card.id)) {
        const list = state.lists.find((l) => l.id === card.listId) || state.lists[0]
        const { listId, ...cardData } = card
        list.cards.push(cardData)
        recovered.push({ id: card.id, title: card.title, list: list.title })
      }
    }
  }

  // Sort each list the way the snapshot had it where possible.
  if (snapshotPath) {
    const snap = JSON.parse(readFileSync(snapshotPath, 'utf8')).state
    for (const list of state.lists) {
      const order = (snap.lists.find((l) => l.id === list.id) || { cards: [] }).cards.map((c) => c.id)
      list.cards.sort((a, b) => {
        const ai = order.indexOf(a.id)
        const bi = order.indexOf(b.id)
        return (ai < 0 ? 1e9 : ai) - (bi < 0 ? 1e9 : bi)
      })
    }
  }

  const current = await rpc('board_get', { p_id: 1 })
  if (current && current.state) {
    console.log('postgres already has a board at rev', current.rev, '- not overwriting')
  } else {
    const seeded = await rpc('board_init', { p_state: state, p_id: 1 })
    console.log('seeded postgres at rev', seeded.rev)
  }

  console.log('recovered cards:', recovered.length ? JSON.stringify(recovered, null, 2) : 'none')
  console.log(
    'lists:',
    state.lists.map((l) => `${l.title}=${l.cards.length}`).join(' ')
  )
}

await main()
