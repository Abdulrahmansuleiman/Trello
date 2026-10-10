import { useState, useRef, useEffect } from 'react'
import CardItem from './CardItem.jsx'
import { IconPlus, IconX, IconDots } from './icons.jsx'

export default function List({
  list,
  labels,
  members,
  dragging,
  dropTarget,
  onOpenCard,
  onAddCard,
  onRenameList,
  onDragStart,
  onDragEnd,
  onDragOverCard,
  onDragOverList,
  onDropList,
}) {
  const [composing, setComposing] = useState(false)
  const [text, setText] = useState('')
  const taRef = useRef(null)

  useEffect(() => {
    if (composing && taRef.current) taRef.current.focus()
  }, [composing])

  const submit = () => {
    const v = text.trim()
    if (!v) {
      setComposing(false)
      return
    }
    onAddCard(list.id, v)
    setText('')
    requestAnimationFrame(() => taRef.current && taRef.current.focus())
  }

  const isTarget = dropTarget && dropTarget.listId === list.id
  const endTarget = isTarget && !dropTarget.beforeCardId

  return (
    <section
      className={`list${endTarget ? ' dragover' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOverList(list.id)
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDropList(list.id, null)
      }}
    >
      <div className="list-header">
        <h2
          className="list-title"
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onBlur={(e) => onRenameList(list.id, e.currentTarget.textContent.trim())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.currentTarget.blur()
            }
          }}
        >
          {list.title}
        </h2>
        <span className="list-count">{list.cards.length}</span>
      </div>

      <div className="cards">
        {list.cards.map((card) => (
          <CardItem
            key={card.id}
            card={card}
            listId={list.id}
            labels={labels}
            members={members}
            isDragging={dragging && dragging.cardId === card.id}
            dropBefore={isTarget && dropTarget.beforeCardId === card.id}
            onOpen={onOpenCard}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOverCard={onDragOverCard}
          />
        ))}

        {composing ? (
          <div className="composer">
            <textarea
              ref={taRef}
              placeholder="Enter a title for this card…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
                if (e.key === 'Escape') {
                  setComposing(false)
                  setText('')
                }
              }}
            />
            <div className="composer-actions">
              <button className="btn-blue" onClick={submit}>
                Add card
              </button>
              <button
                className="btn-ghost"
                aria-label="Cancel"
                onClick={() => {
                  setComposing(false)
                  setText('')
                }}
              >
                <IconX size={16} />
              </button>
            </div>
          </div>
        ) : (
          <button className="add-card" onClick={() => setComposing(true)}>
            <IconPlus size={14} />
            Add a card
          </button>
        )}
      </div>
    </section>
  )
}
