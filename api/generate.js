import { readBoard, writeBoard, storeReady } from './_store.js'
import { buildCards } from './_ideas.js'

function authorised(req) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const header = req.headers.authorization || ''
  return header === `Bearer ${secret}`
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0')

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ ok: false, error: 'method not allowed' })
  }

  if (!storeReady()) {
    return res.status(503).json({ ok: false, error: 'board store not configured' })
  }

  if (!authorised(req)) {
    return res.status(401).json({ ok: false, error: 'unauthorised' })
  }

  try {
    const board = await readBoard()
    if (!board) return res.status(409).json({ ok: false, error: 'board is empty' })

    const ideas = (board.lists || []).find((l) => l.title === 'Ideas')
    if (!ideas) return res.status(409).json({ ok: false, error: 'no Ideas list' })

    const count = Math.max(1, Math.min(5, Number(process.env.IDEAS_PER_DAY || 1)))
    const cards = buildCards(board, count)

    if (!cards.length) {
      return res.status(200).json({ ok: true, added: 0, note: 'every angle in the library is already on the board' })
    }

    ideas.cards = [...(ideas.cards || []), ...cards]
    const written = await writeBoard(board)

    return res.status(200).json({
      ok: true,
      added: cards.length,
      titles: cards.map((c) => c.title),
      ...written,
    })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String((e && e.message) || e) })
  }
}
