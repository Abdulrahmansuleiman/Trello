export const uid = (p = 'id') =>
  `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function saveState(key, state) {
  try {
    localStorage.setItem(key, JSON.stringify(state))
  } catch {
    /* ignore quota errors */
  }
}

export function formatDue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const sameYear = d.getFullYear() === now.getFullYear()
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

export function dueStatus(iso, completed) {
  if (!iso) return 'none'
  if (completed) return 'complete'
  const d = new Date(iso)
  d.setHours(23, 59, 59, 999)
  const now = new Date()
  if (d < now) return 'overdue'
  const diff = d - now
  if (diff < 864e5) return 'soon'
  return 'future'
}
