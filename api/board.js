import {
  readBoard,
  commitOps,
  initBoard,
  restoreRev,
  history,
  storeReady,
  storeInfo,
  DEFAULT_BOARD_ID,
} from './_store.js'
import { isValidState } from '../shared/ops.js'

const MAX_OPS = 200

function boardIdFor(req, body) {
  const raw = body && body.boardId != null ? body.boardId : req.query && req.query.boardId
  const id = Number(raw)
  if (!id || id === DEFAULT_BOARD_ID) return { id: DEFAULT_BOARD_ID, privileged: false }

  const secret = process.env.CRON_SECRET
  const header = req.headers.authorization || ''
  return { id, privileged: Boolean(secret) && header === `Bearer ${secret}` }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate')

  if (!storeReady()) {
    return res.status(503).json({
      ok: false,
      error: 'board store not configured',
      store: storeInfo(),
    })
  }

  try {
    if (req.method === 'GET') {
      if (req.query && (req.query.history === '1' || req.query.history === 'true')) {
        const secret = process.env.CRON_SECRET
        const header = req.headers.authorization || ''
        if (!secret || header !== `Bearer ${secret}`) {
          return res.status(401).json({ ok: false, error: 'unauthorised' })
        }
        const id = Number(req.query.boardId) || DEFAULT_BOARD_ID
        const rows = await history(id, Number(req.query.limit) || 20)
        return res.status(200).json({ ok: true, revisions: rows })
      }

      const id = Number(req.query && req.query.boardId) || DEFAULT_BOARD_ID
      const board = await readBoard(id)
      return res.status(200).json({
        ok: true,
        rev: board ? board.rev : 0,
        state: board ? board.state : null,
        store: storeInfo(),
      })
    }

    if (req.method !== 'POST' && req.method !== 'PUT') {
      res.setHeader('Allow', 'GET, POST')
      return res.status(405).json({ ok: false, error: 'method not allowed' })
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const { id, privileged } = boardIdFor(req, body)

    if (id !== DEFAULT_BOARD_ID && !privileged) {
      return res.status(403).json({ ok: false, error: 'boardId override requires authorisation' })
    }

    // Seed an empty store. Only writes when the row does not exist, so a racing
    // seed can never overwrite real content.
    if (body.init) {
      if (!isValidState(body.init)) {
        return res.status(400).json({ ok: false, error: 'invalid board state' })
      }
      const created = await initBoard(body.init, id)
      return res.status(200).json({ ok: true, seeded: true, rev: created.rev, state: created.state })
    }

    if (body.restoreRev != null) {
      if (!privileged) {
        return res.status(401).json({ ok: false, error: 'unauthorised' })
      }
      const restored = await restoreRev(Number(body.restoreRev), id)
      return res.status(restored.ok ? 200 : 404).json({ ok: restored.ok, ...restored })
    }

    // Whole snapshot writes are refused on purpose. A snapshot from a tab that
    // has been open for a while would silently undo newer work, which is the
    // bug this endpoint used to have.
    if (body.state && !body.ops) {
      return res.status(409).json({
        ok: false,
        error: 'whole board snapshots are not accepted, send ops instead',
      })
    }

    const ops = Array.isArray(body.ops) ? body.ops.slice(0, MAX_OPS) : []
    if (!ops.length) {
      return res.status(400).json({ ok: false, error: 'no ops' })
    }

    const result = await commitOps(ops, id)
    if (!result.ok) {
      return res.status(result.empty ? 409 : 503).json({ ok: false, ...result })
    }

    return res.status(200).json({
      ok: true,
      rev: result.rev,
      state: result.state,
      applied: result.applied,
    })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String((e && e.message) || e) })
  }
}
