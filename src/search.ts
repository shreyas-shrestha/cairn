// Plain-language search. A query is split into entities it recognises (city,
// company, club, lab, major, class year, what someone is open to), which
// become filters, and leftover topic words, which are ranked with BM25 plus
// synonym expansion. Closeness in the warm-path graph breaks ties.

import { ALUMNI, CITIES, CLUBS, COMPANIES, LABS, MAJORS, type OpenTo, type Person } from './data'
import { degree } from './graph'

export interface Understood {
  kind: 'city' | 'company' | 'club' | 'lab' | 'major' | 'year' | 'open' | 'topic'
  label: string
}

export interface Hit {
  person: Person
  score: number
  matched: string[]
}

export interface SearchResult {
  hits: Hit[]
  /** What was actually applied to produce the hits. */
  understood: Understood[]
  /** Words the index has never seen, left out of the search. */
  ignored: string[]
  /** Topics the index knows, but that nobody within the filters matches. */
  missing: string[]
  /** Several topics each matched someone, but nobody matched them all. */
  relaxed: boolean
}

const STOP = new Set(
  `a an the and or of in at on to for from with by who whos whose that which is are was were be been has have had do does did
   i im me my we our you your can could would should want wants need looking look find show tell give get help anyone someone
   somebody people person alumni alum alums alumnus alumna grad grads graduate graduates jacket jackets georgia tech gt
   work works working worked job jobs role roles company companies city cities live lives living based near around moving move
   moved there any some about talk into break breaking interested interest now currently also not all new
   like likes love loves enjoy enjoys good great best really just know knows open up willing able`.split(/\s+/),
)

const SYNONYMS: Record<string, string> = {
  ml: 'machine learning deep learning',
  ai: 'machine learning llms ai research',
  llm: 'llms machine learning',
  climate: 'climate energy renewable batteries solar grid',
  sustainability: 'climate renewable energy',
  energy: 'climate renewable grid batteries',
  space: 'aerospace rockets satellites propulsion',
  rocket: 'rockets propulsion space',
  aerospace: 'space aircraft propulsion avionics',
  startup: 'founder startups',
  founder: 'co-founder cofounder',
  entrepreneur: 'founder startups',
  vc: 'venture capital investor',
  funding: 'venture capital investor fundraising',
  investor: 'venture capital investing',
  fintech: 'payments finance',
  finance: 'banking trading quant',
  trading: 'quant market making',
  quant: 'quantitative trading',
  swe: 'software engineer',
  software: 'backend infrastructure',
  pm: 'product manager',
  product: 'product manager roadmapping',
  design: 'designer ux',
  ux: 'design designer',
  health: 'healthcare medical public health',
  healthcare: 'medical health',
  medical: 'healthcare devices',
  biotech: 'genomics drug discovery bio',
  bio: 'biotech genomics',
  consulting: 'consultant strategy',
  robot: 'robotics autonomy',
  robotics: 'autonomy controls perception',
  autonomous: 'autonomy robotics',
  selfdriving: 'autonomy perception',
  chip: 'semiconductors chip design fpga',
  semiconductor: 'chip design semiconductors',
  hardware: 'embedded fpga pcb',
  logistics: 'supply chain',
  data: 'data science analytics statistics',
  ev: 'electric vehicles batteries',
  car: 'electric vehicles autonomy',
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9+&]+/g, ' ')
    .trim()

const stem = (w: string) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w)
const tokens = (s: string) => norm(s).split(' ').filter(Boolean).map(stem)

// ---------- entity dictionary ----------

interface Entity {
  alias: string
  kind: Understood['kind']
  value: string
}

const entities: Entity[] = []
const add = (kind: Entity['kind'], value: string, aliases: string[]) => {
  for (const a of [value, ...aliases]) entities.push({ alias: norm(a), kind, value })
}
for (const c of CITIES) add('city', c.name, c.aliases)
for (const c of COMPANIES) add('company', c.name, c.aliases ?? [])
for (const c of CLUBS) add('club', c, [])
add('club', 'Yellow Jacket Space Program', ['yjsp'])
add('club', 'Society of Women Engineers', ['swe club'])
add('club', 'GT Solar Racing', ['solar racing'])
add('club', 'GT Motorsports', ['motorsports'])
add('club', 'GT Investments Committee', ['investments committee'])
add('club', 'CREATE-X', ['createx', 'create x'])
for (const l of LABS) add('lab', l, [])
add('lab', 'Institute for Robotics and Intelligent Machines', ['irim'])
add('lab', 'Aerospace Systems Design Lab', ['asdl'])
for (const m of MAJORS) add('major', m.name, m.aliases)
entities.sort((a, b) => b.alias.length - a.alias.length)

const OPEN_WORDS: [RegExp, OpenTo[], string][] = [
  [/\b(hiring|hire|hires|recruiting|recruit|internships?|interns?)\b/g, ['hiring'], 'hiring'],
  [/\b(referrals?|refer|refers)\b/g, ['referrals', 'hiring'], 'open to referrals'],
  [/\b(mentors?|mentoring|mentorship|advice)\b/g, ['mentoring'], 'open to mentoring'],
  [/\b(coffee|chat|chats|call)\b/g, ['coffee'], 'open to a chat'],
]

// ---------- BM25 index ----------

interface Doc {
  tf: Map<string, number>
  len: number
}

// Only what a person does now is searchable by topic: a former employer's name is not their field.
const docs: Doc[] = ALUMNI.map((p) => {
  const text = [
    p.name,
    p.role,
    p.role,
    p.company,
    p.industry,
    p.industry,
    p.skills.join(' '),
    p.skills.join(' '),
    p.major,
  ].join(' ')
  const tf = new Map<string, number>()
  const toks = tokens(text)
  for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1)
  return { tf, len: toks.length }
})
const avgLen = docs.reduce((s, d) => s + d.len, 0) / docs.length
const df = new Map<string, number>()
for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) ?? 0) + 1)

function bm25(doc: Doc, term: string): number {
  const f = doc.tf.get(term)
  if (!f) return 0
  const n = df.get(term) ?? 0
  const idf = Math.log(1 + (docs.length - n + 0.5) / (n + 0.5))
  return (idf * f * 2.2) / (f + 1.2 * (0.25 + 0.75 * (doc.len / avgLen)))
}

// ---------- query ----------

interface Parsed {
  filters: ((p: Person) => boolean)[]
  understood: Understood[]
  groups: { word: string; label: string; terms: { t: string; w: number }[] }[]
}

function parse(query: string): Parsed {
  let q = ` ${norm(query)} `
  const filters: Parsed['filters'] = []
  const understood: Understood[] = []

  // Class year: "class of 2018", "after 2015", "before 2000", "recent grads"
  q = q.replace(/\b(?:class of|graduated in|grad(?:uated)?) (\d{4})\b/g, (_, y) => {
    filters.push((p) => p.year === +y)
    understood.push({ kind: 'year', label: `Class of ${y}` })
    return ' '
  })
  q = q.replace(/\b(?:after|since) (\d{4})\b/g, (_, y) => {
    filters.push((p) => p.year >= +y)
    understood.push({ kind: 'year', label: `${y} or later` })
    return ' '
  })
  q = q.replace(/\bbefore (\d{4})\b/g, (_, y) => {
    filters.push((p) => p.year < +y)
    understood.push({ kind: 'year', label: `Before ${y}` })
    return ' '
  })
  q = q.replace(/\b(?:recent|young|new) (?:grads?|graduates?|alumni|alums?)\b/g, () => {
    filters.push((p) => p.year >= 2021)
    understood.push({ kind: 'year', label: 'Graduated 2021 or later' })
    return ' '
  })

  const byKind = new Map<string, string[]>()
  for (const e of entities) {
    const needle = ` ${e.alias} `
    if (!q.includes(needle)) continue
    q = q.split(needle).join('  ')
    const list = byKind.get(e.kind) ?? []
    if (!list.includes(e.value)) list.push(e.value)
    byKind.set(e.kind, list)
  }
  for (const [kind, values] of byKind) {
    const k = kind as Understood['kind']
    for (const v of values) understood.push({ kind: k, label: v })
    if (k === 'city') filters.push((p) => values.includes(p.city))
    // Current employer only: someone who left a company cannot refer you into it.
    if (k === 'company') filters.push((p) => values.includes(p.company))
    if (k === 'club') filters.push((p) => values.some((v) => p.clubs.includes(v)))
    if (k === 'lab') filters.push((p) => !!p.lab && values.includes(p.lab))
    if (k === 'major') filters.push((p) => values.includes(p.major))
  }

  for (const [re, kinds, label] of OPEN_WORDS) {
    if (!re.test(q)) continue
    re.lastIndex = 0
    q = q.replace(re, ' ')
    filters.push((p) => kinds.some((k) => p.openTo.includes(k)) && p.chatsLeft > 0)
    understood.push({ kind: 'open', label })
  }

  const groups: Parsed['groups'] = []
  for (const raw of q.split(' ').filter(Boolean)) {
    if (STOP.has(raw)) continue
    const word = stem(raw)
    if (STOP.has(word) || groups.some((g) => g.word === word)) continue
    const terms = [{ t: word, w: 1 }]
    const syn = SYNONYMS[raw] ?? SYNONYMS[word]
    if (syn) for (const t of new Set(tokens(syn))) if (t !== word) terms.push({ t, w: 0.45 })
    groups.push({ word, label: raw, terms })
    understood.push({ kind: 'topic', label: raw })
  }
  return { filters, understood, groups }
}

/** A structured search, as produced by the language model in server/gpt.ts. */
export interface Plan {
  cities: string[]
  companies: string[]
  clubs: string[]
  labs: string[]
  majors: string[]
  yearMin: number | null
  yearMax: number | null
  openTo: OpenTo[]
  topics: { term: string; related: string[] }[]
}

const OPEN_LABELS: Record<OpenTo, string> = {
  coffee: 'open to a chat',
  referrals: 'open to referrals',
  mentoring: 'open to mentoring',
  hiring: 'hiring',
}

function fromPlan(plan: Plan): Parsed {
  const filters: Parsed['filters'] = []
  const understood: Understood[] = []
  const known = (kind: Entity['kind'], values: unknown) =>
    (Array.isArray(values) ? values : []).filter((v) => entities.some((e) => e.kind === kind && e.value === v)) as string[]
  const use = (kind: Entity['kind'], values: unknown, test: (p: Person, vs: string[]) => boolean) => {
    const vs = known(kind, values)
    if (!vs.length) return
    for (const v of vs) understood.push({ kind, label: v })
    filters.push((p) => test(p, vs))
  }
  use('city', plan.cities, (p, vs) => vs.includes(p.city))
  use('company', plan.companies, (p, vs) => vs.includes(p.company))
  use('club', plan.clubs, (p, vs) => vs.some((v) => p.clubs.includes(v)))
  use('lab', plan.labs, (p, vs) => !!p.lab && vs.includes(p.lab))
  use('major', plan.majors, (p, vs) => vs.includes(p.major))

  const min = Number.isInteger(plan.yearMin) ? plan.yearMin : null
  const max = Number.isInteger(plan.yearMax) ? plan.yearMax : null
  if (min !== null || max !== null) {
    filters.push((p) => (min === null || p.year >= min) && (max === null || p.year <= max))
    const label = min !== null && max !== null ? (min === max ? `Class of ${min}` : `${min} to ${max}`) : min !== null ? `${min} or later` : `${max} or earlier`
    understood.push({ kind: 'year', label })
  }

  const open = (Array.isArray(plan.openTo) ? plan.openTo : []).filter((o) => o in OPEN_LABELS)
  if (open.length) {
    filters.push((p) => open.some((o) => p.openTo.includes(o)) && p.chatsLeft > 0)
    understood.push({ kind: 'open', label: open.map((o) => OPEN_LABELS[o]).join(' or ') })
  }

  const groups: Parsed['groups'] = []
  for (const topic of (Array.isArray(plan.topics) ? plan.topics : []).slice(0, 4)) {
    if (typeof topic?.term !== 'string' || !topic.term.trim()) continue
    const main = tokens(topic.term)
    const terms = main.map((t) => ({ t, w: 1 }))
    for (const r of Array.isArray(topic.related) ? topic.related : [])
      for (const t of tokens(String(r))) if (!terms.some((x) => x.t === t)) terms.push({ t, w: 0.5 })
    groups.push({ word: main.join(' '), label: topic.term, terms })
    understood.push({ kind: 'topic', label: topic.term })
  }
  return { filters, understood, groups }
}

export const search = (query: string): SearchResult => execute(parse(query))
export const searchPlan = (plan: Plan): SearchResult => execute(fromPlan(plan))

function execute(parsed: Parsed): SearchResult {
  const { filters } = parsed
  const base = parsed.understood.filter((u) => u.kind !== 'topic')
  const isKnown = (g: Parsed['groups'][number]) => g.terms.some((t) => df.has(t.t))
  const ignored = parsed.groups.filter((g) => !isKnown(g)).map((g) => g.label)
  const known = parsed.groups.filter(isKnown)
  const topics = (gs: Parsed['groups']): Understood[] => gs.map((g) => ({ kind: 'topic', label: g.label }))

  // Nothing recognised at all: say so rather than listing everyone.
  if (!filters.length && !known.length && ignored.length) return { hits: [], understood: [], ignored, missing: [], relaxed: false }

  const run = (groups: Parsed['groups'], requireAll: boolean): Hit[] => {
    const queryToks = new Set(groups.flatMap((g) => g.terms.map((t) => t.t)))
    const hits: Hit[] = []
    ALUMNI.forEach((person, i) => {
      for (const f of filters) if (!f(person)) return
      let text = 0
      let groupsHit = 0
      for (const g of groups) {
        let best = 0
        for (const { t, w } of g.terms) best = Math.max(best, bm25(docs[i], t) * w)
        if (best > 0) groupsHit++
        text += best
      }
      if (groups.length && (requireAll ? groupsHit < groups.length : groupsHit === 0)) return
      const d = degree(person.id)
      const closeness = d === 1 ? 1 : d === 2 ? 0.45 : d === 3 ? 0.15 : 0
      const available = person.chatsLeft > 0 ? 0.3 : 0
      const score = text + closeness * (groups.length ? 1.2 : 3) + available + (person.year - 1985) / 400
      const matched = person.skills.filter((s) => tokens(s).some((t) => queryToks.has(t)))
      hits.push({ person, score, matched })
    })
    return hits.sort((a, b) => b.score - a.score)
  }

  let hits = run(known, true)
  if (hits.length || !known.length) return { hits, understood: [...base, ...topics(known)], ignored, missing: [], relaxed: false }

  // Nobody matches every topic. Keep the topics that match someone within the
  // filters, and report the rest as missing instead of pretending they applied.
  const found = known.filter((g) => run([g], true).length > 0)
  const missing = known.filter((g) => !found.includes(g)).map((g) => g.label)
  hits = found.length ? run(found, false) : filters.length ? run([], true) : []
  return { hits, understood: hits.length ? [...base, ...topics(found)] : [], ignored, missing, relaxed: found.length > 1 }
}

export function tally<T extends string>(hits: Hit[], key: (p: Person) => T): { name: T; count: number }[] {
  const m = new Map<T, number>()
  for (const h of hits) m.set(key(h.person), (m.get(key(h.person)) ?? 0) + 1)
  return [...m].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
}
