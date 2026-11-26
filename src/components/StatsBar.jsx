import { boardStats, formatCount, IMPRESSION_TARGET } from '../lib/metrics.js'
import { IconEye } from './icons.jsx'

const shortTitle = (title) => {
  const text = String(title || '').replace(/^(TOF|MOF|BOF|VALUE)[^,]*,/, '').trim()
  return text.length > 44 ? `${text.slice(0, 44)}…` : text
}

export default function StatsBar({ lists }) {
  const stats = boardStats(lists)
  if (!stats.count) return null

  return (
    <div className="statsbar">
      <span className="stats-item">
        <IconEye size={14} /> <b>{stats.count}</b> {stats.count === 1 ? 'post' : 'posts'} tracked
      </span>
      <span className="stats-item">
        Median <b>{formatCount(stats.median)}</b>
      </span>
      {stats.best && (
        <span className="stats-item">
          Best <b>{formatCount(stats.best.impressions)}</b>
          <span className="stats-best-title">{shortTitle(stats.best.title)}</span>
        </span>
      )}
      <span className="stats-item">
        Target {formatCount(IMPRESSION_TARGET)}, <b>{stats.overTarget}</b> past it
      </span>
    </div>
  )
}
