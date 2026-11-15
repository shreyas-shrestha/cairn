// GPT-powered query understanding. The browser sends the raw question; this
// middleware asks an OpenAI model to turn it into a structured search plan
// (constrained by a strict JSON schema to values that exist in the network),
// and the browser runs that plan against the local index. The API key stays
// on the server.

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import { loadEnv } from 'vite'
import { CITIES, CLUBS, COMPANIES, LABS, MAJORS, THIS_YEAR } from '../src/data.ts'

const strings = (values: string[]) => ({ type: 'array', items: { type: 'string', enum: values } })

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['cities', 'companies', 'clubs', 'labs', 'majors', 'yearMin', 'yearMax', 'openTo', 'topics'],
  properties: {
    cities: strings(CITIES.map((c) => c.name)),
    companies: strings(COMPANIES.map((c) => c.name)),
    clubs: strings(CLUBS),
    labs: strings(LABS),
    majors: strings(MAJORS.map((m) => m.name)),
    yearMin: { type: ['integer', 'null'] },
    yearMax: { type: ['integer', 'null'] },
    openTo: strings(['coffee', 'referrals', 'mentoring', 'hiring']),
    topics: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['term', 'related'],
        properties: { term: { type: 'string' }, related: { type: 'array', items: { type: 'string' } } },
      },
    },
  },
}

const INSTRUCTIONS = `You turn a question about the Georgia Tech alumni network into a search plan. The current year is ${THIS_YEAR}.

Fill a field only when the question clearly asks for it; otherwise leave it empty or null.
- cities, companies, clubs, labs, majors: hard filters. Map nicknames and descriptions to the listed values ("the Bay" is San Francisco, "the rocket club" is Yellow Jacket Space Program, "big tech" is the large tech companies). Use majors only when the person asks about what someone studied.
- yearMin, yearMax: graduation year bounds, inclusive. "Recent grads" means the last five years. "Senior people" or "experienced" means graduated at least 12 years ago.
- openTo: what the asker needs from the alum. Looking for a job, internship or referral is ["hiring","referrals"]. Wanting advice or a mentor is ["mentoring"]. Wanting to talk is ["coffee"].
- topics: the subject matter, as at most three items. Each "term" is one or two words likely to appear in a job title, skill list or industry on a profile (for example "robotics", "machine learning", "product manager", "venture capital", "batteries"). "related" holds two to five synonyms or closely related skills and job titles. Infer topics from goals: "I want to build rockets" is propulsion; "help me raise a seed round" is venture capital. Do not repeat a city, company, club or lab as a topic, and do not use generic words like "engineer", "alumni" or "career".

Industries on profiles: Tech, Aerospace, Finance, Consulting, Energy & Climate, Healthcare & Bio, Robotics, Retail & Logistics, Infrastructure, Venture Capital, Startup.`

interface Config {
  key: string
  model: string
  base: string
}

async function plan(query: string, cfg: Config): Promise<unknown> {
  const res = await fetch(`${cfg.base}/responses`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      reasoning: { effort: 'none' },
      input: [
        { role: 'system', content: INSTRUCTIONS },
        { role: 'user', content: query },
      ],
      text: { format: { type: 'json_schema', name: 'search_plan', schema: SCHEMA, strict: true } },
    }),
    signal: AbortSignal.timeout(15_000),
  })
  const body = (await res.json()) as {
    error?: { message?: string }
    output?: { type: string; content?: { type: string; text?: string }[] }[]
  }
  if (!res.ok) throw new Error(body.error?.message ?? `OpenAI returned ${res.status}`)
  const text = body.output
    ?.filter((o) => o.type === 'message')
    .flatMap((o) => o.content ?? [])
    .find((c) => c.type === 'output_text')?.text
  if (!text) throw new Error('The model returned no plan')
  return JSON.parse(text)
}

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

async function readBody(req: IncomingMessage): Promise<string> {
  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 4000) throw new Error('Request too large')
  }
  return raw
}

export function gptSearch(): Plugin {
  let cfg: Config
  const cache = new Map<string, unknown>()

  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url?.split('?')[0]
    if (url === '/api/status') return send(res, 200, { enabled: !!cfg.key, model: cfg.model })
    if (url !== '/api/plan' || req.method !== 'POST') return next()
    if (!cfg.key) return send(res, 503, { error: 'OPENAI_API_KEY is not set' })
    try {
      const { query } = JSON.parse(await readBody(req)) as { query?: unknown }
      if (typeof query !== 'string' || !query.trim() || query.length > 300) return send(res, 400, { error: 'Bad query' })
      const key = query.trim().toLowerCase()
      if (!cache.has(key)) cache.set(key, await plan(query.trim(), cfg))
      send(res, 200, { plan: cache.get(key) })
    } catch (e) {
      send(res, 502, { error: e instanceof Error ? e.message : 'Request failed' })
    }
  }

  return {
    name: 'gpt-search',
    config(_, { mode }) {
      const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
      cfg = {
        key: env.OPENAI_API_KEY ?? '',
        model: env.OPENAI_MODEL || 'gpt-6-luna',
        base: (env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
      }
    },
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}
