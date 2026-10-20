import { gzipSync, gunzipSync } from 'node:zlib'

const EC_ID = process.env.BOARD_EDGE_CONFIG_ID
const TOKEN = process.env.BOARD_VERCEL_TOKEN
const BASE = 'https://api.vercel.com/v1/edge-config'
const META = 'board_meta'
const CHUNK = 6000

async function readItems() {
  const r = await fetch(`${BASE}/${EC_ID}/items`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
    cache: 'no-store',
  })
  if (!r.ok) throw new Error(`edge config read failed: ${r.status}`)
  const j = await r.json()
  const list = Array.isArray(j) ? j : j.items || []
  const map = {}
  for (const item of list) map[item.key] = item.value
  return map
}

function decode(map) {
  const parts = Number(map[META] || 0)
  if (!parts) return null
  let b64 = ''
  for (let i = 0; i < parts; i += 1) {
    const key = `board_${String(i).padStart(3, '0')}`
    const value = map[key]
    if (typeof value !== 'string') return null
    b64 += value
  }
  return JSON.parse(gunzipSync(Buffer.from(b64, 'base64')).toString('utf8'))
}

async function writeItems(items) {
  const r = await fetch(`${BASE}/${EC_ID}/items`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
  })
  if (!r.ok) throw new Error(`edge config write failed: ${r.status} ${await r.text()}`)
}

export function storeReady() {
  return Boolean(EC_ID && TOKEN)
}

export async function readBoard() {
  const map = await readItems()
  return decode(map)
}

export async function writeBoard(state) {
  const json = JSON.stringify(state)
  const b64 = gzipSync(Buffer.from(json, 'utf8'), { level: 9 }).toString('base64')

  const chunks = []
  for (let i = 0; i < b64.length; i += CHUNK) chunks.push(b64.slice(i, i + CHUNK))

  const map = await readItems()
  const prevParts = Number(map[META] || 0)

  const items = chunks.map((value, i) => ({
    operation: 'upsert',
    key: `board_${String(i).padStart(3, '0')}`,
    value,
  }))
  items.push({ operation: 'upsert', key: META, value: String(chunks.length) })

  const stale = []
  for (let i = chunks.length; i < prevParts; i += 1) {
    stale.push({ operation: 'delete', key: `board_${String(i).padStart(3, '0')}` })
  }

  if (stale.length) {
    try {
      await writeItems([...items, ...stale])
    } catch {
      await writeItems(items)
    }
  } else {
    await writeItems(items)
  }

  return { bytes: Buffer.byteLength(json), parts: chunks.length }
}
