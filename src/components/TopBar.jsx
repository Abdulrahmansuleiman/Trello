import { IconLogo, IconStar, IconChevron, IconShare, IconDots } from './icons.jsx'
import { Avatar } from './common.jsx'

export default function TopBar({ title, starred, members, onRename, onToggleStar }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="logo" aria-label="Trello">
          <IconLogo size={20} />
        </button>
        <div className="wordmark">Trello</div>
        <span className="divider" />
        <div className="board-title-wrap">
          <h1
            className="board-title"
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onBlur={(e) => onRename(e.currentTarget.textContent.trim())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.currentTarget.blur()
              }
            }}
          >
            {title}
          </h1>
          <button
            className={`icon-btn star${starred ? ' active' : ''}`}
            aria-label="Star board"
            onClick={onToggleStar}
          >
            <IconStar filled={starred} />
          </button>
          <button className="icon-btn" aria-label="Board menu">
            <IconChevron />
          </button>
        </div>
      </div>

      <div className="topbar-right">
        <div className="member-stack">
          {members.slice(0, 5).map((m) => (
            <Avatar key={m.id} member={m} size="sm" />
          ))}
        </div>
        <button className="pill-btn">
          <IconShare />
          Share
        </button>
        <button className="icon-btn" aria-label="More">
          <IconDots />
        </button>
      </div>
    </header>
  )
}
