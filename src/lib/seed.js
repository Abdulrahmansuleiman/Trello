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
  { id: 'm1', name: 'Raymon Suleiman', initials: 'RS', color: '#0079BF' },
  { id: 'm2', name: 'Filmer', initials: 'FL', color: '#F2D600' },
  { id: 'm3', name: 'Editor', initials: 'ED', color: '#EB5A46' },
  { id: 'm4', name: 'QA', initials: 'QA', color: '#C377E0' },
  { id: 'm5', name: 'Client', initials: 'CL', color: '#00C2E0' },
]

const cover = (seed) => `https://picsum.photos/seed/${seed}/480/260`

export const LAUNCHED_LIST_ID = 'list-launched'

export function makeLaunchedList() {
  return {
    id: LAUNCHED_LIST_ID,
    title: 'Launched Post',
    cards: [
      {
        id: uid('card'),
        title: 'AI SDR for solar — live on YouTube + Reels',
        labels: ['youtube', 'instagram', 'tiktok'],
        members: ['m1'],
        desc: '',
        due: null,
        checklist: [],
      },
      {
        id: uid('card'),
        title: 'Why founders are replacing SDRs with AI agents',
        labels: ['linkedin'],
        members: ['m1'],
        desc: '',
        due: null,
        checklist: [],
      },
    ],
  }
}

const initial = {
  board: { title: 'LaunchOps Media Content', starred: false },
  members: MEMBERS,
  lists: [
    {
      id: 'list-ideas',
      title: 'Ideas',
      cards: [
        {
          id: uid('card'),
          title: 'Meta Ads MCP — control campaigns from Claude Code',
          labels: ['youtube', 'instagram', 'tiktok'],
          members: ['m1'],
          desc: '',
          due: null,
          checklist: [],
        },
        {
          id: uid('card'),
          title: "I don't take on every client — here's how I choose",
          labels: ['linkedin'],
          members: ['m1'],
          desc: '',
          due: null,
          checklist: [],
        },
        {
          id: uid('card'),
          title: 'Why solar companies are the best fit for AI SDRs',
          labels: ['youtube', 'instagram'],
          members: [],
          desc: '',
          due: null,
          checklist: [],
        },
        {
          id: uid('card'),
          title: 'My story: from agency work to building AI agents',
          labels: ['linkedin', 'youtube'],
          members: ['m1'],
          desc: '',
          due: null,
          checklist: [],
        },
      ],
    },
    {
      id: 'list-scripting',
      title: 'Scripting',
      cards: [
        {
          id: uid('card'),
          title: 'D3 Scraper Agent — full build breakdown',
          labels: ['youtube', 'instagram'],
          members: ['m1'],
          desc: '',
          due: null,
          checklist: [
            { id: uid('t'), text: 'Hook', done: true },
            { id: uid('t'), text: 'Problem', done: true },
            { id: uid('t'), text: 'Demo', done: false },
            { id: uid('t'), text: 'CTA', done: false },
          ],
        },
        {
          id: uid('card'),
          title: 'Claude Code posts 5 platforms a day — automation',
          labels: ['youtube', 'tiktok'],
          members: [],
          desc: '',
          due: null,
          checklist: [],
        },
      ],
    },
    {
      id: 'list-filming',
      title: 'Filming',
      cards: [
        {
          id: uid('card'),
          title: 'I Built JARVIS with Claude Code for a Real Estate Client',
          labels: ['youtube', 'instagram', 'tiktok'],
          members: ['m2'],
          cover: cover('jarvis'),
          desc: '',
          due: null,
          checklist: [{ id: uid('t'), text: 'Shot list', done: true }],
        },
        {
          id: uid('card'),
          title: 'Day in the Life — AI agent studio',
          labels: ['youtube', 'instagram'],
          members: ['m2', 'm1'],
          desc: '',
          due: null,
          checklist: [
            { id: uid('t'), text: 'Intro', done: true },
            { id: uid('t'), text: 'B-roll', done: true },
            { id: uid('t'), text: 'Voiceover', done: false },
          ],
        },
      ],
    },
    {
      id: 'list-editing',
      title: 'Editing',
      cards: [
        {
          id: uid('card'),
          title: 'Claude Code — SECOND BRAIN #AI #Automation',
          labels: ['youtube', 'instagram'],
          members: ['m3'],
          desc: '',
          due: null,
          checklist: [
            { id: uid('t'), text: 'Cut rough', done: true },
            { id: uid('t'), text: 'Subtitles', done: true },
            { id: uid('t'), text: 'Thumbnail', done: false },
          ],
        },
        {
          id: uid('card'),
          title: 'POV: you stopped buying templates and built a system',
          labels: ['youtube', 'tiktok'],
          members: ['m3'],
          desc: '',
          due: new Date(Date.now() + 3 * 864e5).toISOString(),
          checklist: [{ id: uid('t'), text: 'Colour grade', done: true }],
        },
        {
          id: uid('card'),
          title: 'AI Voice Agent in 1 Hour',
          labels: ['youtube'],
          members: [],
          desc: '',
          due: null,
          checklist: [],
        },
      ],
    },
    {
      id: 'list-qa',
      title: 'Quality Assurance',
      cards: [
        {
          id: uid('card'),
          title: 'LinkedIn — AI Mastermind for founders',
          labels: ['linkedin'],
          members: ['m4'],
          cover: cover('mastermind'),
          desc: '',
          due: new Date(Date.now() + 1 * 864e5).toISOString(),
          checklist: [{ id: uid('t'), text: 'Facts checked', done: true }],
        },
        {
          id: uid('card'),
          title: 'Solar cold-call agent — final QA pass',
          labels: ['youtube', 'instagram'],
          members: ['m4'],
          desc: '',
          due: null,
          checklist: [
            { id: uid('t'), text: 'Audio levels', done: true },
            { id: uid('t'), text: 'Captions', done: false },
          ],
        },
      ],
    },
    makeLaunchedList(),
  ],
}

export function makeInitialState() {
  return JSON.parse(JSON.stringify(initial))
}

export function ensureLists(state) {
  if (!state || !Array.isArray(state.lists)) return state
  if (state.lists.some((l) => l.id === LAUNCHED_LIST_ID)) return state
  const lists = [...state.lists]
  const qaIdx = lists.findIndex((l) => l.title === 'Quality Assurance')
  const list = makeLaunchedList()
  if (qaIdx >= 0) lists.splice(qaIdx + 1, 0, list)
  else lists.push(list)
  return { ...state, lists }
}
