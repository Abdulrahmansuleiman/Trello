// Daily idea generator for the LaunchOps board.
// Every entry is a ready angle, never a finished post. The writer expands it later.

const TOF = [
  {
    n: 11,
    hook: 'Your ads are not the problem',
    belief: 'the marketing is broken and the fix is another campaign',
    angle: 'Owners buy traffic while the first reply sits overnight. Charlie structure, unhedged opinion, zoomed out.',
    value: 'a way to tell whether you have a traffic problem or a response problem before you spend another pound.',
  },
  {
    n: 11,
    hook: 'Your quote was fine, you were late',
    belief: 'you lose jobs on price',
    angle: 'Most lost jobs are decided by the gap, not the number. Told from the customer side of the screen.',
    value: 'what a customer actually does in the hour after they send an enquiry.',
  },
  {
    n: 11,
    hook: 'Hiring a receptionist will not fix this',
    belief: 'a person on the phones solves lead response',
    angle: 'A person is not there at 9pm and cannot hold five conversations at once. Charlie structure, the decision you made yourself.',
    value: 'the three moments a receptionist cannot cover, and what to put there instead.',
  },
  {
    n: 11,
    hook: 'Everyone says they answer fast',
    belief: 'we already reply quickly',
    angle: 'Ask ten owners how fast they reply and nine will guess. Put the real gap out in the open.',
    value: 'a five minute way to find your true first reply time.',
  },
  {
    n: 11,
    hook: 'The form is not the lead',
    belief: 'once the form lands, the lead is in',
    angle: 'A form is an intention. It expires fast.',
    value: 'what to do in the first sixty seconds after a form lands.',
  },
  {
    n: 11,
    hook: 'More traffic will not save a slow reply',
    belief: 'volume fixes a leaky funnel',
    angle: 'Pouring leads into a slow reply is paying twice for the same person.',
    value: 'the maths owners skip when they buy more leads.',
  },
  {
    n: 11,
    hook: 'Nobody leaves a voicemail anymore',
    belief: 'a missed call turns into a callback',
    angle: 'It does not. They open the next tab and forget you.',
    value: 'where a missed call actually goes, and what to do about it.',
  },
  {
    n: 11,
    hook: 'Speed is not a gimmick',
    belief: 'being fast is a call centre tactic',
    angle: 'Speed is the only part of the sale a customer can judge before they meet you.',
    value: 'why response time is the cheapest thing in the business to fix.',
  },
  {
    n: 11,
    hook: 'Stop training people to beat a machine',
    belief: 'hire better and train harder',
    angle: 'Nobody stays sharp at 11pm on a Sunday. Charlie structure, real decision, no mechanism talk.',
    value: 'which parts of the conversation should never be left to a tired person.',
  },
  {
    n: 11,
    hook: 'Your best month was a response month',
    belief: 'growth comes from campaigns',
    angle: 'Go back to the month that went well and check the reply times.',
    value: 'how to trace a good month back to its real cause.',
  },
  {
    n: 11,
    hook: 'The enquiry you lost was in your inbox',
    belief: 'the lead went cold',
    angle: 'It did not go cold. It went unanswered.',
    value: 'how to audit last month of enquiries without buying anything.',
  },
  {
    n: 11,
    hook: 'Nobody buys from the second reply',
    belief: 'be persistent and follow up later',
    angle: 'Persistence works after they have spoken to you. Before that it is a race.',
    value: 'what persistence should look like in week one.',
  },
  {
    n: 11,
    hook: 'Busy is not the same as full',
    belief: 'we are too busy to fix the front end',
    angle: 'A busy month hides the leak. The quiet month shows it.',
    value: 'what to fix now so the quiet month is not the one that hurts.',
  },
  {
    n: 11,
    hook: 'Customers do not shop around for fun',
    belief: 'people compare three quotes by choice',
    angle: 'They compare because nobody answered first.',
    value: 'how a strong first reply removes the comparison entirely.',
  },
  {
    n: 11,
    hook: 'A better script will not save it',
    belief: 'rewrite the opening message and the rest follows',
    angle: 'The words matter less than the gap before them.',
    value: 'what to fix first if you only have one afternoon.',
  },
  {
    n: 11,
    hook: 'You are not losing to a cheaper quote',
    belief: 'competitors undercut you',
    angle: 'They answered first. That is usually the whole story.',
    value: 'how to test this against your own lost jobs this month.',
  },
  {
    n: 11,
    hook: 'The quiet hour is where you lose',
    belief: 'leads come in during working hours',
    angle: 'A lot of them arrive when the office is dark. Charlie structure, zoomed out, from the lead side.',
    value: 'what your evening enquiries are doing right now.',
  },
  {
    n: 11,
    hook: 'This is not about cutting staff',
    belief: 'automation means fewer people',
    angle: 'It covers the hours nobody wants to work. The team stays, the gap closes.',
    value: 'where the hours actually go missing in a normal week.',
  },
]

const VALUE = [
  {
    hook: 'How to read your own enquiry log',
    teach: 'what a log shows, arrival time, first reply, second reply, booking',
    angle: 'A plain walkthrough of one month of enquiries, read out loud.',
    value: 'a simple read of last month you can do in ten minutes.',
  },
  {
    hook: 'Three numbers that show the gap',
    teach: 'enquiry count, first reply time, conversation rate',
    angle: 'Work them out on one sheet of paper, no new software.',
    value: 'the smallest set of numbers that tells you where the money leaks.',
  },
  {
    hook: 'What a good first message says',
    teach: 'the four things a first reply needs and nothing else',
    angle: 'Show the structure, not a template to copy word for word.',
    value: 'a shape you can use today.',
  },
  {
    hook: 'Where a human should take over',
    teach: 'the handoff point between the agent and the person who closes',
    angle: 'Why the handoff is the part most setups get wrong.',
    value: 'a handoff rule that keeps the sale human.',
  },
  {
    hook: 'How to test an agent before it goes live',
    teach: 'the test conversations to run before a customer ever sees it',
    angle: 'The awkward ones are the ones worth testing.',
    value: 'a checklist to run before launch.',
  },
  {
    hook: 'What to fix before you buy anything',
    teach: 'the order to fix things in, cheapest first',
    angle: 'Most owners buy software to avoid doing the first step.',
    value: 'saves you spending on the wrong end of the problem.',
  },
  {
    hook: 'Questions to ask any response provider',
    teach: 'the questions that separate a real build from a reseller',
    angle: 'Ask these on the call, not after you sign.',
    value: 'protects you from a bad contract.',
  },
  {
    hook: 'Why your follow up stops at day three',
    teach: 'the drop off after the first few touches',
    angle: 'What usually happens between day three and week two.',
    value: 'what to do in week two that most owners never do.',
  },
  {
    hook: 'What happens to an 11pm enquiry',
    teach: 'the full path of a late enquiry, step by step',
    angle: 'Walk it through in conversation, with the reasoning at each step.',
    value: 'shows the hole most setups have.',
  },
  {
    hook: 'How to spot a lead that will never book',
    teach: 'the signals that show a lead is not real',
    angle: 'Stop spending time on the wrong ones.',
    value: 'how to spend your day on the ones that will book.',
  },
  {
    hook: 'A booking is not a conversation',
    teach: 'the difference between a chat and a calendar entry',
    angle: 'Two different numbers, two different fixes.',
    value: 'what to measure so you stop guessing.',
  },
  {
    hook: 'What to do with the ones who went quiet',
    teach: 'reactivation, and why it usually works',
    angle: 'The warm list you already have.',
    value: 'how to get value out of old leads this week.',
  },
  {
    hook: 'How to run this with a small team',
    teach: 'who does what when there are only three of you',
    angle: 'No new hires, no new roles.',
    value: 'a simple split of the work.',
  },
]

const BOF = [
  {
    hook: 'How long until this is live',
    q: 'how long does the build take',
    angle: 'Fourteen days, and what actually happens in each of them.',
    value: 'sets the expectation properly, no vague timeline.',
  },
  {
    hook: 'What if my jobs are too complicated',
    q: 'my work is not simple enough for this',
    angle: 'The agent only needs the first three questions. Complexity comes later, with you.',
    value: 'why a complicated trade is not the blocker.',
  },
  {
    hook: 'Do I need a new phone number',
    q: 'will this change my number',
    angle: 'No. It works alongside what you already have.',
    value: 'shows how it fits into the setup you already run.',
  },
  {
    hook: 'What happens to leads it cannot handle',
    q: 'what if it gets stuck',
    angle: 'It hands over. Nothing gets dropped.',
    value: 'takes the fear out of the edge cases.',
  },
  {
    hook: 'Can I read every conversation',
    q: 'can I see what it actually said',
    angle: 'Yes, and the ones worth reading are short.',
    value: 'shows you stay in control of the words.',
  },
  {
    hook: 'What if I want to switch it off',
    q: 'am I locked into this',
    angle: 'Monthly, off in a day. Nothing is held hostage.',
    value: 'removes the contract fear.',
  },
  {
    hook: 'What does it cost against a receptionist',
    q: 'is this cheaper than hiring someone',
    angle: 'Compare like for like, hours covered against hours paid.',
    value: 'the honest comparison instead of a headline price.',
  },
  {
    hook: 'Who owns the conversations',
    q: 'who owns my data',
    angle: 'You do. Plain answer, no small print.',
    value: 'clarity before anyone signs anything.',
  },
  {
    hook: 'What if my team hates it',
    q: 'will my staff push back',
    angle: 'They usually ask for it once they see the evening leads.',
    value: 'how to introduce it without a fight.',
  },
  {
    hook: 'Will it work for my trade',
    q: 'does this only work in one industry',
    angle: 'Anything with inbound enquiries and a calendar.',
    value: 'a quick way to know if it fits you.',
  },
]

const CYCLE = ['TOF', 'TOF', 'VALUE', 'TOF', 'BOF']

const IMAGES = [
  ['12-IGCj0OwvQHqG5715dCxRJ484CKcaKR', 'photo_work_desk-whatsapp-open.jpg'],
  ['1PD_xmSAK4fMHvuGyyx0UKng-TRqgrHMk', 'photo_work_working-general.jpg'],
  ['1D6D1uGmwkB3k-1XO-Hsilt6c86oxtnyH', 'photo_lifestyle_coffee-and-music.jpg'],
  ['1lPTFb30qFwmEG3e7-2HtAk_-kWR10PXB', 'photo_work_miro-board-snap.jpeg'],
  ['1_leMuQGc1mE7AktUV-YQ4dx_ab_u6MCw', 'photo_meeting_call-with-client_02.jpg'],
  ['1jmCmT7KmfmxdVqcF78dr8HIb9ut8Mvxv', 'photo_meeting_google-meet-with-client.png'],
  ['1cGVcgzCv8GvODbaB5d3cGfPaJxy59p3Z', 'photo_meeting_in-person-client-meetup.jpg'],
  ['1MSQD8bSQVWHXlPMcnF7E-hpeRyWkATFw', 'photo_meeting_zoom-preparing.jpg'],
  ['1s4LqzjS1_GL98wZOD4bFqTn_r_E27dss', 'photo_lifestyle_eating-out-with-family.jpg'],
  ['1Ekip3LYiAjhLnD93jv4Z4zz3HL_ihYWD', 'photo_lifestyle_gym-night-workout.jpg'],
  ['1mznqnymwLF4VABTfBJwy55pljXFBPoyh', 'photo_lifestyle_gym.jpg'],
  ['1V8yvec7XqmvdnNkOZsADrsLnFmCcZIoO', 'photo_lifestyle_outing-with-friends.jpg'],
  ['16xoDTfO4Mph6MK_Ftb0iGKHplwnJAYku', 'photo_lifestyle_outing.jpg'],
  ['1lhF0745TGawu0LSSJHvg_jLYPqmtqiPa', 'photo_lifestyle_shopping.jpg'],
  ['1GbkSJ3q5CrWmazXJDGkAT_wWB97oRMgV', 'photo_travel_in-the-plane.jpg'],
  ['1gWyPv3Mlk7-kdaaUnempK992jiuesaIS', 'photo_travel_working-in-airport.jpg'],
  ['1t48TR855xiWw4lxY9MngRBgUp4XCu8mw', 'photo_travel_working-inside-transit.jpg'],
  ['1hBmFnw7Rxihhb34K9vNvtFXVOjf4yIC6', 'photo_work_client-results.jpg'],
  ['1_9lyQwS7TPcE7n-pJ1UpIw5LCzYJDzxz', 'photo_work_done-for-the-day-coffee.jpg'],
  ['1nEzyUF798iLr5_VFJVU330IdkePfD10E', 'photo_work_laptop-report-document-open.jpg'],
  ['1mY0ZplHus3NymCbX9I08jUQr7dGhDRzC', 'photo_face_thumbs-up.jpeg'],
  ['1mu60A7SYXeBGD3-SVGeOMkQx4oSTsDZ4', 'screenshot_workflow_speed-to-lead.png'],
  ['1OSs5JTtVxAITflzbKZ1HBMcPg06Pv-W6', 'screenshot_workflow_booked-appointment-solar-calendar.png'],
  ['1oFQj9ofnIBMIxjjj9PUUEw-X5y7_Fg8O', 'screenshot_workflow_step2-conversation-agent.png'],
  ['12Qa2JVn_TJ_rQUiLWF7D1e4mk9VhTinb', 'screenshot_workflow_step3-quoting-booking-confirmation.png'],
  ['1EOGGE0okBbcVLvMzKEBKt-BwtcAeTnGz', 'screenshot_meeting_google-meet-client-call-fathom-notetaker.png'],
  ['1Qhq1EwIwA-PQnFLhSoXImFf1si_ko1dB', 'photo_travel_walking-down.jpg'],
]

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
  const prefix = stage === 'VALUE' ? 'VALUE' : `${stage} #${seed.n}`
  return {
    id: `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    title: `${prefix}, ${seed.hook}`,
    labels: ['linkedin'],
    members: [],
    desc: describe(stage, seed),
    due: null,
    checklist: [],
    comments: [
      {
        id: `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        authorId: 'm1',
        authorName: 'Raymon Suleiman',
        initials: 'RS',
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

export function buildCards(board, count) {
  const taken = new Set()
  for (const list of board.lists || []) {
    for (const card of list.cards || []) taken.add(key(card.title))
  }

  const day = Math.floor(Date.now() / 86400000)
  const cards = []
  let step = 0

  while (cards.length < count && step < 12) {
    const stage = CYCLE[(day + step) % CYCLE.length]
    const seed = pickSeed(stage, taken, day + step)
    if (seed) {
      taken.add(key(seed.hook))
      cards.push(makeCard(stage, seed, day + step))
    }
    step += 1
  }

  return cards
}
