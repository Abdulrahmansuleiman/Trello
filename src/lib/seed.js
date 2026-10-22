let seedCounter = 0
const uid = (p) => `${p}-${Date.now().toString(36)}-${(seedCounter++).toString(36)}`

export const LABELS = {
  youtube: { id: 'youtube', name: 'YouTube', color: '#FF0000', icon: 'youtube' },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    gradient: 'linear-gradient(45deg,#833AB4,#FD1D1D,#FCB045)',
    color: '#E1306C',
    icon: 'instagram',
  },
  tiktok: { id: 'tiktok', name: 'TikTok', color: '#010101', icon: 'tiktok' },
  linkedin: { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', icon: 'linkedin' },
  facebook: { id: 'facebook', name: 'Facebook', color: '#1877F2', icon: 'facebook' },
  reel: { id: 'reel', name: 'Reel', color: '#C377E0', icon: null },
  shorts: { id: 'shorts', name: 'Shorts', color: '#61BD4F', icon: null },
}

export const MEMBERS = [
  { id: 'm1', name: 'Abdulrahman Suleiman', initials: 'AS', color: '#0079BF' },
  { id: 'm2', name: 'Filmer', initials: 'FL', color: '#F2D600' },
  { id: 'm3', name: 'Editor', initials: 'ED', color: '#EB5A46' },
  { id: 'm4', name: 'QA', initials: 'QA', color: '#C377E0' },
  { id: 'm5', name: 'Client', initials: 'CL', color: '#00C2E0' },
]

export const CURRENT_USER = MEMBERS[0]

const comment = (text, hoursAgo = 0) => ({
  id: uid('c'),
  authorId: CURRENT_USER.id,
  authorName: CURRENT_USER.name,
  initials: CURRENT_USER.initials,
  color: CURRENT_USER.color,
  text,
  createdAt: new Date(Date.now() - hoursAgo * 36e5).toISOString(),
})

// Google Drive cover served through the drive-usercontent endpoint.
const drive = (token) => `https://drive.google.com/u/0/drive-usercontent/${token}=w1600`

export const LAUNCHED_LIST_ID = 'list-launched'

export function makeLaunchedList() {
  return {
    id: LAUNCHED_LIST_ID,
    title: 'Launched Post',
    cards: [],
  }
}

// Canonical board content. This is what every browser sees when the shared
// board store is empty, and it is republished whenever the store is reset.
const initial = {
  board: { title: 'LaunchOps Media Content', starred: false },
  members: MEMBERS,
  lists: [
    {
      id: 'list-ideas',
      title: 'Ideas',
      cards: [
        {
          id: 'card-mvfugu5v-seh3c',
          title:
            'TOF #8, The most expensive mistake: waiting for things to calm down before touching lead response.',
          labels: ['linkedin'],
          members: [],
          desc: '',
          due: null,
          checklist: [],
          comments: [],
          cover: drive('1R5Jo_drJaqxfK229uA4tCwZWy0aziOm3'),
        },
        {
          id: 'card-mvfugsom-w3d0z',
          title: 'TOF #2, Hire last. Fix the first reply before you fix the payroll.',
          labels: ['linkedin'],
          members: [],
          desc: '',
          due: null,
          checklist: [],
          comments: [],
          cover: drive('1B2XOq1JBisZeUz7VX_Zx7u8JUEL7zsRX'),
        },
        {
          id: 'card-mvfugvx1-meenm',
          title: 'MOF #4, What actually happens to an enquiry, from arrival to booked appointment.',
          labels: ['linkedin'],
          members: [],
          desc: '',
          due: null,
          checklist: [],
          comments: [],
          cover: drive('12pQ4nSPfvKlknc5o3y1wCPiUmdw26iGd'),
        },
        {
          id: 'card-mvfugxas-p126u',
          title: "MOF #28, Saved replies, missed call text back, shared inbox: what each one can't do.",
          labels: ['linkedin'],
          members: [],
          desc: '',
          due: null,
          checklist: [],
          comments: [],
          cover: drive('1f5ComeTN_T3swdTZLKK2hzjBVem5Td32'),
        },
      ],
    },
    {
      id: 'list-scripting',
      title: 'Scripting',
      cards: [],
    },
    {
      id: 'list-filming',
      title: 'Filming',
      cards: [],
    },
    {
      id: 'list-editing',
      title: 'Editing',
      cards: [],
    },
    {
      id: 'list-qa',
      title: 'Quality Assurance',
      cards: [],
    },
    makeLaunchedList(),
  ],
}

export function makeInitialState() {
  return JSON.parse(JSON.stringify(initial))
}

export function ensureLists(state) {
  if (!state || !Array.isArray(state.lists)) return state
  let lists = [...state.lists]

  if (!lists.some((l) => l.id === LAUNCHED_LIST_ID)) {
    const qaIdx = lists.findIndex((l) => l.title === 'Quality Assurance')
    const list = makeLaunchedList()
    if (qaIdx >= 0) lists.splice(qaIdx + 1, 0, list)
    else lists.push(list)
  }

  lists = lists.map((l) => ({ ...l, cards: Array.isArray(l.cards) ? l.cards : [] }))

  return { ...state, lists }
}

export function stripDashes(text) {
  if (typeof text !== 'string' || !/[—–-]/.test(text)) return text
  return text
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\s+-\s+/g, ', ')
    .replace(/([A-Za-z0-9])-([A-Za-z0-9])/g, '$1 $2')
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .replace(/\s*,\s*,+\s*/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function sanitizeState(state) {
  if (!state || !Array.isArray(state.lists)) return state
  const lists = state.lists.map((l) => ({
    ...l,
    title: typeof l.title === 'string' ? l.title : String(l.title || ''),
    cards: (l.cards || []).map((c) => ({
      ...c,
      title: stripDashes(c.title),
      desc: stripDashes(c.desc),
      checklist: (c.checklist || []).map((t) => ({ ...t, text: stripDashes(t.text) })),
    })),
  }))
  return { ...state, lists }
}
