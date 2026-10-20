// Optional model generated ideas. Falls back to the curated library when no key is set.
// OpenAI compatible: works with OpenAI, OpenRouter, Groq, DeepSeek or any /chat/completions endpoint.

const LENSES = [
  'a customer story from the first hour',
  'a belief owners hold that you disagree with',
  'what the gap costs in real money',
  'a number almost no owner can quote',
  'a mistake you see every single week',
  'a question that keeps coming up on sales calls',
  'a straight comparison between two approaches',
  'a myth doing the rounds in the trade',
  'one enquiry walked through minute by minute',
  'an objection you hear on almost every call',
  'a short checklist someone can use today',
  'a prediction about the next twelve months',
  'a behind the scenes detail from a real build',
  'a lesson from a deal that slipped away',
  'the moment a customer decides to stop waiting',
  'what a busy owner gets wrong about hiring',
]

const VOICE = `You write LinkedIn post briefs for Raymon, founder of LaunchOps.
Audience: owners of UK solar, roofing and home services businesses. Never agencies.
Voice: plain British English, short sentences, no hype, no corporate words, no emojis.
Hard rules:
- Never use a dash of any kind, no hyphen, no en, no em. Use a comma or a full stop instead.
- Never invent client names, testimonials, statistics or case studies.
- Never use these words: unlock, leverage, seamless, robust, game changer, elevate, dive in, landscape, revolutionise, cutting edge, supercharge.
- Hooks are opinions or observations, not questions and not clickbait. Maximum 9 words.
- Every idea must be specific enough that a writer could start typing immediately.`

const STAGE_RULES = {
  TOF: 'The reader is not shopping yet. Take a belief they hold and put pressure on it. Point at something they can check in their own business today.',
  VALUE: 'Teach one concrete thing. The reader should be able to do it this week without buying anything. No product pitch.',
  BOF: 'The reader is close to buying and has a specific worry. Answer it plainly and honestly, including the limits.',
}

function pickLenses(day, count) {
  return Array.from({ length: count }, (_, i) => LENSES[(day * count + i) % LENSES.length])
}

export function modelConfigured() {
  return Boolean(process.env.IDEA_MODEL_KEY || process.env.OPENAI_API_KEY)
}

export async function generateIdeas({ stages, existing, day }) {
  const key = process.env.IDEA_MODEL_KEY || process.env.OPENAI_API_KEY
  if (!key) return null

  const base = (process.env.IDEA_MODEL_BASE || 'https://api.openai.com/v1').replace(/\/$/, '')
  const model = process.env.IDEA_MODEL_NAME || 'gpt-4o-mini'
  const lenses = pickLenses(day, stages.length)

  const avoid = existing.slice(0, 60).join('\n')

  const brief = stages
    .map((stage, i) => {
      const n = i + 1
      return `Idea ${n}\nStage: ${stage}\nLens: ${lenses[i]}\n${STAGE_RULES[stage]}`
    })
    .join('\n\n')

  const user = `Write ${stages.length} distinct LinkedIn post briefs. They must not share the same point, the same opening thought or the same lesson.

${brief}

Already used on this board, do not reuse or closely echo any of these ideas:
${avoid || '(none yet)'}

Return JSON only, shaped exactly like this:
{"ideas":[{"stage":"TOF","hook":"...","belief":"...","angle":"...","value":"..."}]}

Field rules by stage:
- TOF: include "belief" (the wrong belief you are taking apart). Leave "teach" and "question" empty strings.
- VALUE: include "teach" (the one thing being taught). Leave "belief" and "question" empty strings.
- BOF: include "question" (the worry in the owners own words). Leave "belief" and "teach" empty strings.

"angle" is two sentences of direction, specific to this idea.
"value" is one sentence on what the reader walks away with.`

  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0.9,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: VOICE },
        { role: 'user', content: user },
      ],
    }),
  })

  if (!res.ok) throw new Error(`model call failed: ${res.status} ${await res.text()}`)

  const json = await res.json()
  const text = json.choices?.[0]?.message?.content || ''
  const parsed = JSON.parse(text)
  const ideas = Array.isArray(parsed.ideas) ? parsed.ideas : []
  if (!ideas.length) throw new Error('model returned no ideas')

  return ideas
}
