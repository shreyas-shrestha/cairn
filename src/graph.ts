// Warm-path graph: people are linked through shared affiliations (lab, club,
// employer, cohort, dorm). A breadth-first search from the signed-in student
// gives everyone a degree of separation and a concrete chain of introductions.

import { ME, PEOPLE, type Person } from './data'

export type AffKind = 'lab' | 'club' | 'company' | 'cohort' | 'dorm'

export interface Aff {
  key: string
  kind: AffKind
  label: string
}

export interface Hop {
  from: Person
  via: Aff
  to: Person
}

// Stronger ties are explored first, so the first path found prefers them.
function affsOf(p: Person): Aff[] {
  const out: Aff[] = []
  if (p.lab) out.push({ key: `lab:${p.lab}`, kind: 'lab', label: p.lab })
  for (const c of p.clubs) out.push({ key: `club:${c}`, kind: 'club', label: c })
  const companies = p.id === 0 ? p.prev : [p.company, ...p.prev]
  for (const c of companies) out.push({ key: `co:${c}`, kind: 'company', label: c })
  out.push({ key: `cohort:${p.major}:${p.year}`, kind: 'cohort', label: `${p.major} ’${String(p.year).slice(2)}` })
  out.push({ key: `dorm:${p.dorm}:${p.year}`, kind: 'dorm', label: `${p.dorm} Hall` })
  return out
}

const personAffs = PEOPLE.map(affsOf)
const members = new Map<string, number[]>()
PEOPLE.forEach((p, i) => {
  for (const a of personAffs[i]) {
    const list = members.get(a.key)
    if (list) list.push(p.id)
    else members.set(a.key, [p.id])
  }
})

const dist = new Int16Array(PEOPLE.length).fill(-1)
const parent = new Int32Array(PEOPLE.length).fill(-1)
const parentAff: (Aff | null)[] = PEOPLE.map(() => null)

{
  dist[ME.id] = 0
  const queue = [ME.id]
  const seenAff = new Set<string>()
  for (let head = 0; head < queue.length; head++) {
    const id = queue[head]
    for (const a of personAffs[id]) {
      if (seenAff.has(a.key)) continue
      seenAff.add(a.key)
      for (const other of members.get(a.key)!) {
        if (dist[other] !== -1) continue
        dist[other] = dist[id] + 1
        parent[other] = id
        parentAff[other] = a
        queue.push(other)
      }
    }
  }
}

/** Degrees of separation from the signed-in student, or -1 if unreachable. */
export const degree = (id: number) => dist[id]

/** Chain of introductions from the student to this person. */
export function pathTo(id: number): Hop[] {
  const hops: Hop[] = []
  let cur = id
  while (cur !== ME.id && parent[cur] !== -1) {
    hops.unshift({ from: PEOPLE[parent[cur]], via: parentAff[cur]!, to: PEOPLE[cur] })
    cur = parent[cur]
  }
  return hops
}

// The signed-in student is still on campus, so their own ties are present
// tense: "you" in the interface (naming the other person), "we" in a note.
export function tie(a: Aff, who = 'you', other = 'they'): string {
  const plural = other === 'they'
  if (a.kind === 'club') {
    if (who === 'you') return `you’re in ${a.label}, and so ${plural ? 'were they' : `was ${other}`}`
    if (who === 'we') return `I’m in ${a.label} now, as you were`
    return `${who} were both in ${a.label}`
  }
  if (a.kind === 'lab') {
    if (who === 'you') return `you do research at the ${a.label}, and so did ${other}`
    if (who === 'we') return `I do research at the ${a.label}, as you did`
    return `${who} both did research at the ${a.label}`
  }
  if (a.kind === 'company') return `${who === 'you' ? `you and ${other}` : who} both worked at ${a.label}`
  if (a.kind === 'cohort') return `${who === 'you' ? `you and ${other}` : who} were ${a.label} classmates`
  return `${who === 'you' ? `you and ${other}` : who} both lived in ${a.label} the same year`
}

/** The student's own tie to a third person, as written in a note to someone else. */
export function tieMine(a: Aff, other: string): string {
  if (a.kind === 'club') return `I’m in ${a.label}, as ${other} was`
  if (a.kind === 'lab') return `I do research at the ${a.label}, as ${other} did`
  if (a.kind === 'company') return `${other} and I both worked at ${a.label}`
  if (a.kind === 'cohort') return `${other} and I were classmates`
  return `${other} and I lived in ${a.label} the same year`
}

/** One-line summary of how the student is connected to someone. */
export function connection(id: number): string {
  const hops = pathTo(id)
  if (!hops.length) return 'No shared clubs, labs or employers yet'
  const name = hops[0].to.name.split(' ')[0]
  if (hops.length === 1) return cap(tie(hops[0].via, 'you', name))
  return `Through ${hops[0].to.name}`
}

/** Compact form of the connection, for list rows. */
export function shortConnection(id: number): string {
  const hops = pathTo(id)
  if (!hops.length) return ''
  if (hops.length > 1) return `via ${hops[0].to.name}`
  const a = hops[0].via
  switch (a.kind) {
    case 'lab':
      return 'same lab as you'
    case 'club':
      return `${a.label}, like you`
    case 'company':
      return hops[0].to.company === a.label ? 'you interned at their company' : `also worked at ${a.label}`
    case 'cohort':
      return 'your classmate'
    case 'dorm':
      return `${a.label} with you`
  }
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
