import { Avatar, LabelChip } from './common.jsx'
import CoverImage from './CoverImage.jsx'
import {
  IconCheckbox,
  IconClock,
  IconDescription,
  IconAttachment,
  IconComment,
} from './icons.jsx'
import { formatDue, dueStatus } from '../lib/storage.js'

export default function CardItem({
  card,
  labels,
  members,
  listId,
  isDragging,
  dropBefore,
  onOpen,
  onDragStart,
  onDragEnd,
  onDragOverCard,
  onDropAt,
}) {
  const cardLabels = (card.labels || []).map((id) => labels[id]).filter(Boolean)
  const cardMembers = (card.members || [])
    .map((id) => members.find((m) => m.id === id))
    .filter(Boolean)

  const done = (card.checklist || []).filter((c) => c.done).length
  const total = (card.checklist || []).length
  const hasDesc = card.desc && card.desc.trim().length > 0
  const commentCount = (card.comments || []).length
  const dueSt = dueStatus(card.due, card.dueComplete)

  const showFoot =
    cardMembers.length > 0 || card.due || total > 0 || hasDesc || card.cover || commentCount > 0

  return (
    <div
      className={`card${isDragging ? ' dragging' : ''}${dropBefore ? ' drop-before' : ''}`}
      data-card-id={card.id}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        try {
          e.dataTransfer.setData('text/plain', card.id)
        } catch {
          /* some browsers block setData on synthetic events */
        }
        onDragStart(card.id, listId)
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        e.preventDefault()
        e.stopPropagation()
        const box = e.currentTarget.getBoundingClientRect()
        const after = e.clientY > box.top + box.height / 2
        if (after) {
          const next = e.currentTarget.nextElementSibling
          onDragOverCard(listId, next && next.getAttribute('data-card-id'))
        } else {
          onDragOverCard(listId, card.id)
        }
      }}
      onDrop={(e) => {
        e.preventDefault()
        e.stopPropagation()
        const draggedId = e.dataTransfer.getData('text/plain') || card.id
        const box = e.currentTarget.getBoundingClientRect()
        const after = e.clientY > box.top + box.height / 2
        const next = e.currentTarget.nextElementSibling
        onDropAt(draggedId, after && next ? next.getAttribute('data-card-id') : card.id)
      }}
      onClick={() => onOpen(card.id)}
    >
      {card.cover ? (
        <div className="card-cover">
          <CoverImage src={card.cover} />
        </div>
      ) : null}

      {cardLabels.length > 0 && (
        <div className="card-labels">
          {cardLabels.map((l) => (
            <LabelChip key={l.id} label={l} showName />
          ))}
        </div>
      )}

      <div className="card-title">{card.title}</div>

      {showFoot && (
        <div className="card-foot">
          <div className="card-badges">
            {card.due && (
              <span className={`badge due ${dueSt}`}>
                <IconClock size={14} />
                {formatDue(card.due)}
              </span>
            )}
            {total > 0 && (
              <span className={`badge${done === total ? ' done' : ''}`}>
                <IconCheckbox size={14} />
                {done}/{total}
              </span>
            )}
            {hasDesc && (
              <span className="badge">
                <IconDescription size={14} />
              </span>
            )}
            {card.cover && (
              <span className="badge">
                <IconAttachment size={13} />
              </span>
            )}
            {commentCount > 0 && (
              <span className="badge">
                <IconComment size={14} />
                {commentCount}
              </span>
            )}
          </div>
          {cardMembers.length > 0 && (
            <div className="card-members">
              {cardMembers.map((m) => (
                <Avatar key={m.id} member={m} size="sm" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
