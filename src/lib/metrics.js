// Post performance. One card is one post, so the readings live on the card.
// A reading is a snapshot of the impression count LinkedIn shows for that post.
// More than one reading is kept per card so we can see a post still travelling.

export const IMPRESSION_TARGET = 5000

const toList = (card) => (Array.isArray(card && card.metrics) ? card.metrics : [])

export function today() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
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
