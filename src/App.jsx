import { useState, useEffect, useRef } from 'react'
import TopBar from './components/TopBar.jsx'
import List from './components/List.jsx'
import CardModal from './components/CardModal.jsx'
import { IconPlus, IconX } from './components/icons.jsx'
import { LABELS, makeInitialState, ensureLists, sanitizeState } from './lib/seed.js'
import { loadState, saveState, uid } from './lib/storage.js'

const KEY = 'launchops-trello-board-v1'

export default function App() {
  const [state, setState] = useState(() => sanitizeState(ensureLists(loadState(KEY, makeInitialState()))))
  const [openCardId, setOpenCardId] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const [addListOpen, setAddListOpen] = useState(false)
  const [newListTitle, setNewListTitle] = useState('')
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)

  useEffect(() => saveState(KEY, state), [state])

  const notify = (msg) => {
    clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }

  const findCard = (lists, id) => {
    for (const l of lists) {
      const c = l.cards.find((c) => c.id === id)
      if (c) return { card: c, listId: l.id }
    }
    return null
  }

  const moveCard = (cardId, targetListId, beforeCardId = null) => {
    setState((prev) => {
      const src = findCard(prev.lists, cardId)
      if (!src) return prev
      const lists = prev.lists.map((l) => ({ ...l, cards: [...l.cards] }))
      const fromList = lists.find((l) => l.id === src.listId)
      const idx = fromList.cards.findIndex((c) => c.id === cardId)
      const [card] = fromList.cards.splice(idx, 1)

      const toList = lists.find((l) => l.id === targetListId)
      if (!toList) return prev
      const pos = beforeCardId ? toList.cards.findIndex((c) => c.id === beforeCardId) : -1
      const at = pos >= 0 ? pos : toList.cards.length
      toList.cards.splice(at, 0, card)

      if (src.listId !== targetListId) {
        notify(`Card moved to ${toList.title}`)
      }
      return { ...prev, lists }
    })
    setDragging(null)
    setDropTarget(null)
  }

  const addCard = (listId, title) =>
    setState((prev) => ({
      ...prev,
      lists: prev.lists.map((l) =>
        l.id === listId
          ? {
              ...l,
              cards: [
                ...l.cards,
                { id: uid('card'), title, labels: [], members: [], desc: '', due: null, checklist: [], comments: [] },
              ],
            }
          : l
      ),
    }))

  const addList = () => {
    const t = newListTitle.trim()
    if (!t) return
    setState((prev) => ({
      ...prev,
      lists: [...prev.lists, { id: uid('list'), title: t, cards: [] }],
    }))
    setNewListTitle('')
    setAddListOpen(false)
  }

  const renameList = (listId, title) =>
    setState((prev) => ({
      ...prev,
      lists: prev.lists.map((l) => (l.id === listId ? { ...l, title } : l)),
    }))

  const renameBoard = (title) => setState((prev) => ({ ...prev, board: { ...prev.board, title } }))

  const toggleStar = () =>
    setState((prev) => ({ ...prev, board: { ...prev.board, starred: !prev.board.starred } }))

  const updateCard = (cardId, patch) =>
    setState((prev) => ({
      ...prev,
      lists: prev.lists.map((l) => ({
        ...l,
        cards: l.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
      })),
    }))

  const deleteCard = (cardId) => {
    setState((prev) => ({
      ...prev,
      lists: prev.lists.map((l) => ({
        ...l,
        cards: l.cards.filter((c) => c.id !== cardId),
      })),
    }))
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
        onRename={renameBoard}
        onToggleStar={toggleStar}
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
            onDragOverCard={(listId, cardId) => setDropTarget({ listId, beforeCardId: cardId })}
            onDragOverList={(listId) => setDropTarget({ listId, beforeCardId: null })}
            onDropList={(listId) => moveCard(dragging && dragging.cardId, listId, dropTarget && dropTarget.beforeCardId)}
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