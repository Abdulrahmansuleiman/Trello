import { useState, useCallback } from 'react'
import TopBar from './components/TopBar.jsx'
import List from './components/List.jsx'
import CardModal from './components/CardModal.jsx'
import { IconPlus, IconX } from './components/icons.jsx'
import { LABELS } from './lib/seed.js'
import { uid } from './lib/storage.js'
import useBoardSync from './lib/sync.js'

const emptyCard = (title) => ({
  id: uid('card'),
  title,
  labels: [],
  members: [],
  desc: '',
  due: null,
  checklist: [],
  comments: [],
})

export default function App() {
  const { state, status, rev, run, retryNow } = useBoardSync()

  const [openCardId, setOpenCardId] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const [addListOpen, setAddListOpen] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [toast, setToast] = useState(null)

  const notify = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 2200)
  }, [])

  const findCard = (lists, id) => {
    for (const l of lists) {
      const c = l.cards.find((x) => x.id === id)
      if (c) return { card: c, listId: l.id }
    }
    return null
  }

  const moveCard = (cardId, targetListId, beforeCardId = null) => {
    setDragging(null)
    setDropTarget(null)
    if (!cardId || !targetListId) return

    const src = findCard(state.lists, cardId)
    if (!src) return
    if (src.listId === targetListId) {
      const list = state.lists.find((l) => l.id === targetListId)
      const currentIndex = list.cards.findIndex((c) => c.id === cardId)
      const targetIndex = beforeCardId
        ? list.cards.findIndex((c) => c.id === beforeCardId)
        : list.cards.length - 1
      if (targetIndex === currentIndex) return
    }

    run({ type: 'move', cardId, toListId: targetListId, beforeCardId: beforeCardId || null })

    const targetTitle = (state.lists.find((l) => l.id === targetListId) || {}).title
    if (src.listId !== targetListId && targetTitle) notify(`Moved to ${targetTitle}`)
  }

  const addCard = (listId, title) => {
    const clean = String(title || '').trim()
    if (!clean) return
    run({ type: 'addCard', listId, card: emptyCard(clean) })
  }

  const addList = () => {
    const title = newListTitle.trim()
    if (!title) return
    run({ type: 'addList', list: { id: uid('list'), title, cards: [] } })
    setNewListTitle('')
    setAddListOpen(false)
  }

  const renameList = (listId, title) => run({ type: 'renameList', listId, title })
  const renameBoard = (title) => run({ type: 'renameBoard', title })
  const toggleStar = () => run({ type: 'setStar', starred: !state.board.starred })
  const updateCard = (cardId, patch) => run({ type: 'updateCard', cardId, patch })

  const deleteCard = (cardId) => {
    run({ type: 'deleteCard', cardId })
    setOpenCardId(null)
    notify('Card deleted')
  }

  const openCard = findCard(state.lists, openCardId)

  return (
    <div className="app">
      <TopBar
        title={state.board.title}
        starred={state.board.starred}
        members={state.members}
        status={status}
        rev={rev}
        onRename={renameBoard}
        onToggleStar={toggleStar}
        onRetry={retryNow}
      />

      <main className="board">
        {state.lists.map((list) => (
          <List
            key={list.id}
            list={list}
            labels={LABELS}
            members={state.members}
            dragging={dragging}
            dropTarget={dropTarget}
            onOpenCard={setOpenCardId}
            onAddCard={addCard}
            onRenameList={renameList}
            onDragStart={(cardId, listId) => setDragging({ cardId, listId })}
            onDragEnd={() => {
              setDragging(null)
              setDropTarget(null)
            }}
            onDragOverCard={(listId, cardId) => setDropTarget({ listId, beforeCardId: cardId || null })}
            onDragOverList={(listId, beforeCardId) =>
              setDropTarget({ listId, beforeCardId: beforeCardId || null })
            }
            onDropAt={(listId, cardId, beforeCardId) => moveCard(cardId, listId, beforeCardId)}
          />
        ))}

        {addListOpen ? (
          <div className="composer" style={{ flex: '0 0 272px', width: 272 }}>
            <textarea
              autoFocus
              className="input-dark"
              placeholder="Enter list title…"
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addList()
                }
                if (e.key === 'Escape') {
                  setAddListOpen(false)
                  setNewListTitle('')
                }
              }}
            />
            <div className="composer-actions">
              <button className="btn-blue" onClick={addList}>
                Add list
              </button>
              <button
                className="btn-ghost"
                aria-label="Cancel"
                onClick={() => {
                  setAddListOpen(false)
                  setNewListTitle('')
                }}
              >
                <IconX size={16} />
              </button>
            </div>
          </div>
        ) : (
          <button className="add-list" onClick={() => setAddListOpen(true)}>
            <IconPlus size={15} /> Add another list
          </button>
        )}
      </main>

      {openCard && (
        <CardModal
          card={openCard.card}
          lists={state.lists}
          labels={LABELS}
          members={state.members}
          onClose={() => setOpenCardId(null)}
          onUpdate={updateCard}
          onDelete={deleteCard}
          onMoveToList={(cardId, listId) => moveCard(cardId, listId)}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
