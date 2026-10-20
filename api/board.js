import { readBoard, writeBoard, storeReady } from './_store.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')

  if (!storeReady()) {
    return res.status(503).json({ ok: false, error: 'board store not configured' })
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ ok: true, state: await readBoard() })
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const state = body && body.state ? body.state : body
      if (!state || !Array.isArray(state.lists)) {
        return res.status(400).json({ ok: false, error: 'invalid board state' })
      }
      const written = await writeBoard(state)
      return res.status(200).json({ ok: true, ...written })
    }

    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ ok: false, error: 'method not allowed' })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String((e && e.message) || e) })
  }
}
