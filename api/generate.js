import { readBoard, writeBoard, storeReady } from './_store.js'
import { buildCards, cardsFromIdeas, stagesForDay, titleKey, librarySize } from './_ideas.js'
import { generateIdeas, modelConfigured } from './_llm.js'

function authorised(req) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const header = req.headers.authorization || ''
  return header === `Bearer ${secret}`
}

const clean = (text) =>
  String(text || '')
    .replace(/[\u2013\u2014-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

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

    const ideasList = (board.lists || []).find((l) => l.title === 'Ideas')
    if (!ideasList) return res.status(409).json({ ok: false, error: 'no Ideas list' })

    const count = Math.max(1, Math.min(6, Number(process.env.IDEAS_PER_DAY || 4)))
    const day = Math.floor(Date.now() / 86400000)
    const stages = stagesForDay(day, count)

    const existing = []
    const taken = new Set()
    for (const list of board.lists || []) {
      for (const card of list.cards || []) {
        existing.push(card.title)
        taken.add(titleKey(card.title))
      }
    }

    let cards = []
    let source = 'library'
    let warning = null

    if (modelConfigured()) {
      try {
        const raw = await generateIdeas({ stages, existing, day })
        const usable = (raw || [])
          .map((idea) => ({
            stage: idea.stage,
            hook: clean(idea.hook),
            belief: clean(idea.belief),
            teach: clean(idea.teach),
            question: clean(idea.question),
            angle: clean(idea.angle),
            value: clean(idea.value),
          }))
          .filter((idea) => idea.hook && idea.angle && !taken.has(titleKey(idea.hook)))

        for (const idea of usable) taken.add(titleKey(idea.hook))
        cards = cardsFromIdeas(usable.slice(0, count))
        source = 'model'
      } catch (e) {
        warning = `model failed, used library: ${String((e && e.message) || e)}`
      }
    }

    if (cards.length < count) {
      const filler = buildCards(board, count - cards.length)
      cards = [...cards, ...filler]
    }

    if (!cards.length) {
      return res.status(200).json({
        ok: true,
        added: 0,
        note: 'every angle in the library is already on the board',
        library: librarySize(),
      })
    }

    ideasList.cards = [...(ideasList.cards || []), ...cards]
    const written = await writeBoard(board)

    return res.status(200).json({
      ok: true,
      added: cards.length,
      source,
      titles: cards.map((c) => c.title),
      warning,
      library: librarySize(),
      ...written,
    })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String((e && e.message) || e) })
  }
}
