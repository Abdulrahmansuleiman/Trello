import { TOF, VALUE, BOF, IMAGES } from './_library.js'

const LISTS = { TOF, VALUE, BOF }

const key = (title) =>
  String(title || '')
    .replace(/^\s*(TOF|MOF|BOF|VALUE)\s*#?\s*\d*\s*[,:]\s*/i, '')
    .trim()
    .toLowerCase()

function describe(stage, seed) {
  if (stage === 'TOF') {
    return `Type ${seed.n}, the industry belief you disagree with (TOF).\n\nBelief to take apart: ${seed.belief}.\n\nAngle: ${seed.angle}\n\nValue: ${seed.value}`
  }
  if (stage === 'VALUE') {
    return `Expertise post, value stream.\n\nWhat it teaches: ${seed.teach}.\n\nAngle: ${seed.angle}\n\nValue: ${seed.value}`
  }
  return `Type 13, the question owners ask most on calls (BOF).\n\nQuestion: ${seed.q}.\n\nAngle: ${seed.angle}\n\nValue: ${seed.value}`
}

function makeCard(stage, seed, slot) {
  const [token, name] = IMAGES[slot % IMAGES.length]
  const num = seed.n || (stage === 'BOF' ? 13 : 11)
  const prefix = stage === 'VALUE' ? 'VALUE' : `${stage} #${num}`
  const stamp = Date.now().toString(36)
  return {
    id: `card-${stamp}-${Math.random().toString(36).slice(2, 7)}`,
    title: `${prefix}, ${seed.hook}`,
    labels: ['linkedin'],
    members: [],
    desc: describe(stage, seed),
    due: null,
    checklist: [],
    comments: [
      {
        id: `c-${stamp}-${Math.random().toString(36).slice(2, 6)}`,
        authorId: 'm1',
        authorName: 'Abdulrahman Suleiman',
        initials: 'AS',
        color: '#0079BF',
        text: `Image: ${name} (Drive, Image for posts)`,
        createdAt: new Date().toISOString(),
      },
    ],
    cover: `https://drive.google.com/u/0/drive-usercontent/${token}=w1600`,
  }
}

function pickSeed(stage, taken, offset) {
  const list = LISTS[stage]
  for (let i = 0; i < list.length; i += 1) {
    const seed = list[(offset + i) % list.length]
    if (!taken.has(key(seed.hook))) return seed
  }
  return null
}

const stagesForDay = (day, limit) => {
  if (limit <= 1) return ['TOF']
  const other = day % 2 === 0 ? 'VALUE' : 'BOF'
  return [...Array(limit - 1).fill('TOF'), other]
}

export { stagesForDay }

export function cardsFromIdeas(ideas) {
  const day = Math.floor(Date.now() / 86400000)
  return ideas.map((idea, i) => {
    const stage = ['TOF', 'VALUE', 'BOF'].includes(idea.stage) ? idea.stage : 'TOF'
    const seed = {
      n: Number(idea.type) || (stage === 'BOF' ? 13 : 11),
      hook: String(idea.hook || '').trim(),
      belief: String(idea.belief || '').trim(),
      teach: String(idea.teach || '').trim(),
      q: String(idea.question || '').trim(),
      angle: String(idea.angle || '').trim(),
      value: String(idea.value || '').trim(),
    }
    return makeCard(stage, seed, day + i)
  })
}

export { key as titleKey }

export function buildCards(board, count) {
  const taken = new Set()
  for (const list of board.lists || []) {
    for (const card of list.cards || []) taken.add(key(card.title))
  }

  const day = Math.floor(Date.now() / 86400000)
  const cards = []
  const limit = Math.max(1, Math.min(6, Number(count) || 1))
  const stages = stagesForDay(day, limit)

  let step = 0
  while (cards.length < limit && step < 20) {
    const stage = stages[cards.length]
    const seed = pickSeed(stage, taken, day + step)
    if (seed) {
      taken.add(key(seed.hook))
      cards.push(makeCard(stage, seed, day + step))
    }
    step += 1
  }

  return cards
}

export function librarySize() {
  return { TOF: TOF.length, VALUE: VALUE.length, BOF: BOF.length, total: TOF.length + VALUE.length + BOF.length }
}
