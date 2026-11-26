// Post performance. One card is one post, so the readings live on the card.
// A reading is a snapshot of the impression count LinkedIn shows for that post.
// More than one reading is kept per card so we can see a post still travelling.
//
// Shared by the browser and the Telegram agent, so the date is always London.

export const IMPRESSION_TARGET = 5000
export const TIME_ZONE = 'Europe/London'

const toList = (card) => (Array.isArray(card && card.metrics) ? card.metrics : [])

export function today(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function londonHour(now = new Date()) {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TIME_ZONE,
      hour: '2-digit',
      hour12: false,
    }).format(now)
  )
}

export function readings(card) {
  return [...toList(card)].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

export function latestReading(card) {
  const list = readings(card)
  return list.length ? list[list.length - 1] : null
}

export function firstReading(card) {
  const list = readings(card)
  return list.length ? list[0] : null
}

export function bestReading(card) {
  return readings(card).reduce(
    (best, cur) => (!best || cur.impressions > best.impressions ? cur : best),
    null
  )
}

// How much the post has grown since the first number was logged.
export function growth(card) {
  const first = firstReading(card)
  const last = latestReading(card)
  if (!first || !last || first.id === last.id) return null
  return last.impressions - first.impressions
}

export function readOn(card, date) {
  return toList(card).find((r) => r.date === date) || null
}

// One reading per day. Logging the same day again corrects it instead of
// stacking a second number on top of it.
export function addReading(card, impressions, date) {
  const value = Number(String(impressions == null ? '' : impressions).replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(value) || value <= 0) return null
  const at = date || today()
  const kept = toList(card).filter((r) => r.date !== at)
  return [
    ...kept,
    { id: `m-${at}-${Date.now().toString(36)}`, date: at, impressions: Math.round(value) },
  ]
}

export function removeReading(card, id) {
  return toList(card).filter((r) => r.id !== id)
}

export function formatCount(n) {
  if (!Number.isFinite(n)) return '0'
  return new Intl.NumberFormat('en-GB').format(Math.round(n))
}

export function formatDate(date) {
  if (!date) return ''
  const d = new Date(`${date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function median(nums) {
  const list = (nums || []).filter((n) => Number.isFinite(n)).sort((a, b) => a - b)
  if (!list.length) return 0
  const mid = Math.floor(list.length / 2)
  return list.length % 2 ? list[mid] : Math.round((list[mid - 1] + list[mid]) / 2)
}

// Board level view: one row per post that has at least one reading.
export function boardStats(lists) {
  const tracked = []
  for (const list of lists || []) {
    for (const card of list.cards || []) {
      const last = latestReading(card)
      if (!last) continue
      tracked.push({
        id: card.id,
        title: card.title,
        list: list.title,
        impressions: last.impressions,
        date: last.date,
        count: toList(card).length,
      })
    }
  }

  const values = tracked.map((t) => t.impressions)
  const best = tracked.reduce((a, b) => (!a || b.impressions > a.impressions ? b : a), null)

  return {
    tracked: tracked.sort((a, b) => b.impressions - a.impressions),
    count: tracked.length,
    median: median(values),
    best,
    overTarget: values.filter((v) => v >= IMPRESSION_TARGET).length,
  }
}

// The posts the daily prompt asks about: the newest few in the Launched list.
// Indexes are positions in the full Launched list, so they never shift when a
// new post goes in or a number gets logged.
export const PROMPT_POOL = 4

// A post comes back for a second reading once a week, so we can see whether it
// is still travelling.
export const RECHECK_DAYS = 5

const dayNumber = (date) => {
  const d = new Date(`${date}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? 0 : Math.floor(d.getTime() / 864e5)
}

export function launchedList(lists) {
  const all = lists || []
  return all.find((l) => l.id === 'list-launched') || all.find((l) => /launched/i.test(l.title || ''))
}

export function promptPool(lists) {
  const list = launchedList(lists)
  const cards = (list && list.cards) || []
  const start = Math.max(0, cards.length - PROMPT_POOL)
  return cards.slice(start).map((card, i) => ({ index: start + i + 1, card }))
}

// Ask about a post when it has never had a number, or when the last number is
// old enough that it is worth a second look. Never ask twice in one day.
export function pendingToday(lists, date = today()) {
  return promptPool(lists).filter(({ card }) => {
    if (readOn(card, date)) return false
    const list = readings(card)
    if (!list.length) return true
    return dayNumber(date) - dayNumber(list[list.length - 1].date) >= RECHECK_DAYS
  })
}

export function findInPool(lists, index) {
  return promptPool(lists).find((entry) => entry.index === index) || null
}
