import { PlatformIcon } from './icons.jsx'

export function Avatar({ member, size = 'sm', className = '', style }) {
  if (!member) return null
  const cls = `avatar ${size} ${className}`.trim()
  return (
    <span className={cls} style={{ background: member.color, ...style }} title={member.name}>
      {member.initials}
    </span>
  )
}

export function LabelChip({ label, showName = true }) {
  if (!label) return null
  const bg = label.gradient || label.color
  if (!showName && !label.icon) {
    return <span className="label-chip plain" style={{ background: bg }} title={label.name} />
  }
  return (
    <span className="label-chip" style={{ background: bg }} title={label.name}>
      {label.icon ? <PlatformIcon name={label.icon} size={12} /> : null}
      {showName ? label.name : null}
    </span>
  )
}
