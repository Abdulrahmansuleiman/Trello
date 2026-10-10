import { useState, useRef, useEffect } from 'react'
import { Avatar, LabelChip } from './common.jsx'
import { IconX, IconCheck, IconTrash, IconPlus, IconClock } from './icons.jsx'
import { dueStatus, uid } from '../lib/storage.js'

function AutoTextarea({ value, onChange, className, placeholder, minRows = 1 }) {
  const ref = useRef(null)
  const resize = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }
  useEffect(resize, [value])
  return (
    <textarea
      ref={ref}
      className={className}
      placeholder={placeholder}
      value={value}
      rows={minRows}
      onChange={(e) => {
        onChange(e.target.value)
        requestAnimationFrame(resize)
      }}
    />
  )
}

export default function CardModal({
  card,
  lists,
  labels,
  members,
  onClose,
  onUpdate,
  onDelete,
  onMoveToList,
}) {
  const [newItem, setNewItem] = useState('')
  const list = lists.find((l) => l.cards.some((c) => c.id === card.id))
  const checklist = card.checklist || []
  const done = checklist.filter((c) => c.done).length
  const total = checklist.length
  const pct = total ? Math.round((done / total) * 100) : 0
  const st = dueStatus(card.due, card.dueComplete)

  const toggleLabel = (id) => {
    const set = new Set(card.labels || [])
    set.has(id) ? set.delete(id) : set.add(id)
    onUpdate(card.id, { labels: [...set] })
  }
  const toggleMember = (id) => {
    const set = new Set(card.members || [])
    set.has(id) ? set.delete(id) : set.add(id)
    onUpdate(card.id, { members: [...set] })
  }
  const toggleItem = (id) => {
    onUpdate(card.id, {
      checklist: checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)),
    })
  }
  const removeItem = (id) => {
    onUpdate(card.id, { checklist: checklist.filter((c) => c.id !== id) })
  }
  const addItem = () => {
    const v = newItem.trim()
    if (!v) return
    onUpdate(card.id, {
      checklist: [...checklist, { id: uid('t'), text: v, done: false }],
    })
    setNewItem('')
  }

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal">
        {card.cover && (
          <div className="modal-cover">
            <img src={card.cover} alt="" draggable={false} />
          </div>
        )}

        <div className="modal-body">
          <div className="modal-head">
            <AutoTextarea
              className="modal-title"
              value={card.title}
              placeholder="Card title"
              onChange={(v) => onUpdate(card.id, { title: v })}
            />
            <button className="modal-close" aria-label="Close" onClick={onClose}>
              <IconX size={18} />
            </button>
          </div>

          <div className="modal-sub">
            in list{' '}
            <select
              value={list ? list.id : ''}
              onChange={(e) => onMoveToList(card.id, e.target.value)}
            >
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </div>

          <div className="section">
            <div className="field-label">Members</div>
            <div className="chip-row">
              {members.map((m) => {
                const on = (card.members || []).includes(m.id)
                return (
                  <button
                    key={m.id}
                    className={`member-chip${on ? '' : ' off'}`}
                    onClick={() => toggleMember(m.id)}
                  >
                    <Avatar member={m} size="sm" />
                    {m.name}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="section">
            <div className="field-label">Labels</div>
            <div className="chip-row">
              {Object.values(labels).map((l) => (
                <button
                  key={l.id}
                  className={`label-toggle${(card.labels || []).includes(l.id) ? ' on' : ''}`}
                  style={{ background: l.gradient || l.color }}
                  onClick={() => toggleLabel(l.id)}
                >
                  {l.name}
                </button>
              ))}
            </div>
          </div>

          <div className="section modal-grid">
            <div className="field">
              <div className="field-label">
                <IconClock size={14} /> Due date
              </div>
              {card.due ? (
                <div className={`badge due ${st}`} style={{ fontSize: 13, padding: '4px 10px' }}>
                  {new Date(card.due).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              ) : (
                <div className="empty-hint">No due date</div>
              )}
              <input
                className="input-dark"
                style={{ marginTop: 8 }}
                type="date"
                value={card.due ? card.due.slice(0, 10) : ''}
                onChange={(e) =>
                  onUpdate(card.id, {
                    due: e.target.value ? new Date(e.target.value).toISOString() : null,
                    dueComplete: false,
                  })
                }
              />
              {card.due && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 10,
                    fontSize: 13,
                    color: '#dbe2e9',
                  }}
                >
                  <span className={`check-box${card.dueComplete ? ' on' : ''}`}>
                    <IconCheck size={12} />
                  </span>
                  <input
                    type="checkbox"
                    checked={!!card.dueComplete}
                    onChange={(e) => onUpdate(card.id, { dueComplete: e.target.checked })}
                    style={{ display: 'none' }}
                  />
                  Mark complete
                </label>
              )}
            </div>

            <div className="field">
              <div className="field-label">Cover image</div>
              <input
                className="input-dark"
                placeholder="Paste image URL…"
                value={card.cover || ''}
                onChange={(e) => onUpdate(card.id, { cover: e.target.value || null })}
              />
            </div>
          </div>

          <div className="section">
            <div className="field-label">Checklist</div>
            {total > 0 && (
              <>
                <div style={{ fontSize: 13, color: '#dbe2e9', marginBottom: 2 }}>
                  {pct}% ({done}/{total})
                </div>
                <div className="progress">
                  <span style={{ width: `${pct}%` }} />
                </div>
              </>
            )}
            {checklist.map((c) => (
              <div key={c.id} className="check-item">
                <button
                  className={`check-box${c.done ? ' on' : ''}`}
                  aria-label="Toggle"
                  onClick={() => toggleItem(c.id)}
                >
                  <IconCheck size={12} />
                </button>
                <span className={`check-text${c.done ? ' done' : ''}`}>{c.text}</span>
                <button className="btn-ghost" aria-label="Remove" onClick={() => removeItem(c.id)}>
                  <IconX size={14} />
                </button>
              </div>
            ))}
            <div className="composer-actions" style={{ marginTop: 10 }}>
              <input
                className="input-dark"
                placeholder="Add an item…"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
              />
              <button className="btn-blue" onClick={addItem}>
                <IconPlus size={14} /> Add
              </button>
            </div>
          </div>

          <div className="section">
            <div className="field-label">Description</div>
            <textarea
              className="input-dark"
              placeholder="Add a more detailed description…"
              value={card.desc || ''}
              onChange={(e) => onUpdate(card.id, { desc: e.target.value })}
            />
          </div>

          <button className="modal-danger" onClick={() => onDelete(card.id)}>
            <IconTrash size={16} /> Delete card
          </button>
        </div>
      </div>
    </div>
  )
}
