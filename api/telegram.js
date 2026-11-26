// Telegram agent for post performance.
//
// Two ways in:
//   GET  /api/telegram?cron=1   Vercel cron, 9am, asks for yesterday's numbers
//   POST /api/telegram          Telegram webhook, takes his reply and logs it
//
// It never invents a number and never guesses which post he means. The prompt
// lists the newest posts in Launched Post with a stable number each, and the
// reply has to name one of those numbers.

import { commitOps, readBoard, storeReady } from './_store.js'
import {
  addReading,
  removeReading,
  latestReading,
  readOn,
  boardStats,
  promptPool,
  pendingToday,
  findInPool,
  formatCount,
  today,
  IMPRESSION_TARGET,
} from '../shared/metrics.js'

const TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '').trim()
const CHAT = (process.env.TELEGRAM_CHAT_ID || '').trim()
const WEBHOOK_SECRET = (process.env.TELEGRAM_WEBHOOK_SECRET || '').trim()
const CRON_SECRET = (process.env.CRON_SECRET || '').trim()

const API = () => `https://api.telegram.org/bot${TOKEN}`

const esc = (text) =>
  String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

async function tg(method, payload) {
  const r = await fetch(`${API()}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
  const json = await r.json().catch(() => null)
  if (!r.ok || (json && json.ok === false)) {
    throw new Error(`telegram ${method} failed: ${r.status} ${JSON.stringify(json).slice(0, 200)}`)
  }
  return json
}

const send = (chatId, text) =>
  tg('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  })

const shortHook = (title) => String(title || '').replace(/^(TOF|MOF|BOF|VALUE)\s*#?\d*,?\s*/i, '').trim()

function lineFor(entry) {
  const label = `${entry.index}. ${esc(entry.card.title)}`
  const url = entry.card.postUrl
  return url ? `<a href="${esc(url)}">${label}</a>` : label
}

function promptText(lists, date) {
  const pending = pendingToday(lists, date)
  if (!pending.length) {
    return (
      'Nothing needs a number today.\n\n' +
      'If you posted, move the card into Launched Post and send /today.'
    )
  }

  const lines = pending.map(lineFor)
  const lead =
    pending.length === 1
      ? "Morning. Yesterday's number?"
      : `Morning. Yesterday's numbers? ${pending.length} posts need one.`

  const example = pending.length === 1 ? '1240' : `${pending[0].index} 1240`

  return [
    lead,
    '',
    lines.join('\n\n'),
    '',
    `Reply like <code>${example}</code>.`,
    '/skip if you did not post.',
  ].join('\n')
}

function statsText(lists) {
  const stats = boardStats(lists)
  if (!stats.count) return 'No numbers logged yet. Send /today to see what needs one.'

  const lines = [
    `${stats.count} ${stats.count === 1 ? 'post' : 'posts'} tracked.`,
    `Median ${formatCount(stats.median)}.`,
  ]
  if (stats.best) {
    lines.push(`Best ${formatCount(stats.best.impressions)}, ${esc(shortHook(stats.best.title))}.`)
  }
  lines.push(
    stats.overTarget
      ? `${stats.overTarget} past the ${formatCount(IMPRESSION_TARGET)} target.`
      : `None past the ${formatCount(IMPRESSION_TARGET)} target yet.`
  )
  return lines.join('\n')
}

function confirmText(card, value, lists) {
  const stats = boardStats(lists)
  const gap = IMPRESSION_TARGET - value
  const lines = [
    `Logged ${formatCount(value)} on ${esc(shortHook(card.title))}.`,
    '',
    `Median ${formatCount(stats.median)} across ${stats.count}.`,
  ]
  if (gap > 0) {
    lines.push(`Target ${formatCount(IMPRESSION_TARGET)}. That one is ${formatCount(gap)} short.`)
  } else {
    lines.push(`Past the ${formatCount(IMPRESSION_TARGET)} target. ${stats.overTarget} over it now.`)
  }
  return lines.join('\n')
}

function newestReading(lists) {
  let found = null
  for (const list of lists || []) {
    for (const card of list.cards || []) {
      for (const reading of card.metrics || []) {
        if (
          !found ||
          reading.date > found.reading.date ||
          (reading.date === found.reading.date && reading.id > found.reading.id)
        ) {
          found = { card, reading }
        }
      }
    }
  }
  return found
}

async function loadBoard() {
  const board = await readBoard()
  if (!board || !board.state) throw new Error('board store is empty')
  return board.state
}

async function handleText(text, chatId) {
  const state = await loadBoard()
  const lists = state.lists || []
  const date = today()
  const body = String(text || '').trim()

  if (/^\/start\b/i.test(body)) {
    const who = CHAT && String(chatId) === CHAT ? 'This chat is allowed.' : `Chat id: <code>${chatId}</code>`
    return (
      `Post performance bot.\n\n${who}\n\n` +
      'Every morning at 9 I ask for the number on yesterday\'s post.\n\n' +
      '/today, what needs a number\n' +
      '/stats, median and best\n' +
      '/undo, remove the last number I logged'
    )
  }

  if (/^\/(today|list)\b/i.test(body)) return promptText(lists, date)
  if (/^\/(stats|median)\b/i.test(body)) return statsText(lists)
  if (/^\/skip\b/i.test(body)) return 'Skipped. Nothing logged.'
  if (/^\/(help|commands)\b/i.test(body)) {
    return (
      'Send a number to log it.\n\n' +
      '<code>1 1240</code> post 1 got 1,240 impressions\n' +
      '<code>1240</code> when only one post is pending\n\n' +
      '/today /stats /undo'
    )
  }

  if (/^\/undo\b/i.test(body)) {
    const last = newestReading(lists)
    if (!last) return 'Nothing to undo.'
    const next = removeReading(last.card, last.reading.id)
    const res = await commitOps([
      { type: 'updateCard', cardId: last.card.id, patch: { metrics: next } },
    ])
    if (!res.ok) return 'Could not save that. Try again in a minute.'
    return `Removed ${formatCount(last.reading.impressions)} from ${esc(shortHook(last.card.title))}.`
  }

  const pair = body.match(/^(\d{1,3})\s+([\d.,]+)$/)
  const single = body.match(/^([\d.,]+)$/)

  let entry = null
  let value = null

  if (pair) {
    entry = findInPool(lists, Number(pair[1]))
    value = Number(pair[2].replace(/[^\d]/g, ''))
    if (!entry) {
      return `There is no post ${pair[1]} in the last ${promptPool(lists).length}. Send /today to see the list.`
    }
  } else if (single) {
    const pending = pendingToday(lists, date)
    if (pending.length !== 1) {
      return pending.length
        ? `Which post? Send the number first, like <code>${pending[0].index} ${single[1]}</code>.`
        : 'Nothing is pending today. Send /today to see the list.'
    }
    entry = pending[0]
    value = Number(single[1].replace(/[^\d]/g, ''))
  } else {
    return 'I only log numbers. Send <code>1 1240</code>, or /today for the list.'
  }

  if (!Number.isFinite(value) || value <= 0) {
    return 'That number does not look right. Send it like <code>1 1240</code>.'
  }

  const card = entry.card
  const next = addReading(card, value, date)
  if (!next) return 'That number does not look right. Send it like <code>1 1240</code>.'

  const res = await commitOps([{ type: 'updateCard', cardId: card.id, patch: { metrics: next } }])
  if (!res.ok) return 'Could not save that. Try again in a minute.'

  return confirmText(card, value, (res.state && res.state.lists) || lists)
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate')

  if (!storeReady()) {
    return res.status(503).json({ ok: false, error: 'board store not configured' })
  }
  if (!TOKEN) {
    return res.status(503).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN is not set' })
  }

  try {
    if (req.method === 'GET') {
      const auth = req.headers.authorization || ''
      const key = (req.query && req.query.key) || ''
      if (!CRON_SECRET || (auth !== `Bearer ${CRON_SECRET}` && key !== CRON_SECRET)) {
        return res.status(401).json({ ok: false, error: 'unauthorised' })
      }
      if (!CHAT) {
        return res.status(400).json({ ok: false, error: 'TELEGRAM_CHAT_ID is not set' })
      }

      const state = await loadBoard()
      const text = promptText(state.lists || [], today())

      if (req.query && req.query.dry) {
        return res.status(200).json({ ok: true, dry: true, text })
      }

      await send(CHAT, text)
      return res.status(200).json({ ok: true, sent: true })
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST')
      return res.status(405).json({ ok: false, error: 'method not allowed' })
    }

    if (WEBHOOK_SECRET) {
      const header = req.headers['x-telegram-bot-api-secret-token'] || ''
      if (header !== WEBHOOK_SECRET) {
        return res.status(401).json({ ok: false, error: 'unauthorised' })
      }
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
    const message = body.message || body.edited_message || null
    if (!message || !message.text) return res.status(200).json({ ok: true, ignored: true })

    const chatId = String((message.chat && message.chat.id) || '')
    if (CHAT && chatId !== CHAT) {
      return res.status(200).json({ ok: true, ignored: 'chat not allowed' })
    }

    const reply = await handleText(message.text, chatId)
    await send(chatId, reply)
    return res.status(200).json({ ok: true, replied: true })
  } catch (e) {
    const msg = String((e && e.message) || e)
    // Still answer the webhook so Telegram does not retry the same update forever.
    if (req.method === 'POST') {
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}
        const chatId = body && body.message && body.message.chat && body.message.chat.id
        if (chatId) await send(String(chatId), 'Something went wrong on my side. Try again.')
      } catch {
        /* ignore */
      }
      return res.status(200).json({ ok: false, error: msg })
    }
    return res.status(500).json({ ok: false, error: msg })
  }
}
