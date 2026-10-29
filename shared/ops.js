// Shared card operations. Imported by both the browser (src/) and the API
// (api/). Every change to a board is sent as an operation, never as a whole
// board snapshot, so a slow or stale client can not overwrite newer work.

function findRef(lists, cardId) {
  for (let li = 0; li < lists.length; li += 1) {
    const ci = lists[li].cards.findIndex((c) => c.id === cardId)
    if (ci >= 0) return { li, ci }
  }
  return null
}

const cloneLists = (lists) => lists.map((l) => ({ ...l, cards: l.cards.slice() }))

export function applyOp(state, op) {
  if (!state || !op || !op.type) return state
  const lists = state.lists || []

  switch (op.type) {
    case 'move': {
      if (!op.cardId || !op.toListId) return state
      const ref = findRef(lists, op.cardId)
      if (!ref) return state
      const to = lists.findIndex((l) => l.id === op.toListId)
      if (to < 0) return state

      const next = cloneLists(lists)
      const [card] = next[ref.li].cards.splice(ref.ci, 1)
      if (!card) return state

      const target = next[to].cards
      let at = target.length
      if (op.beforeCardId) {
        const before = target.findIndex((c) => c.id === op.beforeCardId)
        if (before >= 0) at = before
      }
      target.splice(at, 0, card)
      return { ...state, lists: next }
    }

    case 'addCard': {
      const card = op.card
      if (!card || !card.id || !op.listId) return state
      if (findRef(lists, card.id)) return state
      const to = lists.findIndex((l) => l.id === op.listId)
      if (to < 0) return state
      const next = cloneLists(lists)
      next[to].cards.push(card)
      return { ...state, lists: next }
    }

    case 'updateCard': {
      if (!op.cardId || !op.patch) return state
      const ref = findRef(lists, op.cardId)
      if (!ref) return state
      const next = cloneLists(lists)
      next[ref.li].cards[ref.ci] = { ...next[ref.li].cards[ref.ci], ...op.patch }
      return { ...state, lists: next }
    }

    case 'deleteCard': {
      if (!op.cardId) return state
      const ref = findRef(lists, op.cardId)
      if (!ref) return state
      const next = cloneLists(lists)
      next[ref.li].cards.splice(ref.ci, 1)
      return { ...state, lists: next }
    }

    case 'addList': {
      const list = op.list
      if (!list || !list.id || !Array.isArray(list.cards)) return state
      if (lists.some((l) => l.id === list.id)) return state
      return { ...state, lists: [...lists, list] }
    }

    case 'renameList': {
      if (!op.listId) return state
      const title = String(op.title || '').trim()
      if (!title) return state
      return {
        ...state,
        lists: lists.map((l) => (l.id === op.listId ? { ...l, title } : l)),
      }
    }

    case 'renameBoard': {
      const title = String(op.title || '').trim()
      if (!title) return state
      return { ...state, board: { ...state.board, title } }
    }

    case 'toggleStar':
      return { ...state, board: { ...state.board, starred: !state.board.starred } }

    case 'setStar':
      return { ...state, board: { ...state.board, starred: Boolean(op.starred) } }

    default:
      return state
  }
}

export function applyOps(state, ops) {
  return (ops || []).reduce((acc, op) => applyOp(acc, op), state)
}

export function isValidState(state) {
  if (!state || typeof state !== 'object') return false
  if (!Array.isArray(state.lists)) return false
  return state.lists.every(
    (l) => l && typeof l.id === 'string' && Array.isArray(l.cards)
  )
}
