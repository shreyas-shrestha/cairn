// Drafts a first note from the shared context between the student and an
// alum. Template-based so the demo runs with no API key. The note is built
// from the person's role and company and the real tie between the two people;
// a topic is mentioned only when the student searched for it.

import { ME, THIS_YEAR, type Person } from './data'
import { tie, tieMine, type Hop } from './graph'

const first = (p: Person) => p.name.split(' ')[0]
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const YEAR_NAME = ['fourth-year', 'third-year', 'second-year', 'first-year']
const standing = YEAR_NAME[Math.min(3, Math.max(0, ME.year - THIS_YEAR))]

export function draftIntro(target: Person, hops: Hop[], viaIntroducer: boolean, topic?: string): string {
  const words = (topic ?? '').toLowerCase().split(/\s+/).filter((w) => w.length > 2)
  const interest = target.skills.find((s) => words.some((w) => s.toLowerCase().includes(w)))
  const focus = interest ? ` I’m looking into ${interest} in particular.` : ''
  const me = `a ${standing} ${ME.major} student`
  const sign = `Go Jackets,\n${first(ME)}`

  if (viaIntroducer && hops.length > 1) {
    const mid = hops[0].to
    return `Hi ${first(mid)},\n\n${cap(tie(hops[0].via, 'we'))}, though we haven’t met. I’m ${me} and I’d like to talk to ${target.name}, ${target.role} at ${target.company}.${focus} I saw that ${tie(hops[1].via, `you and ${first(target)}`)}. Would you introduce us? I’d ask for 15 minutes on a call, nothing more.\n\n${sign}`
  }

  const link =
    hops.length === 1
      ? `${cap(tie(hops[0].via, 'we'))}.`
      : hops.length > 1
        ? `${cap(tieMine(hops[0].via, hops[0].to.name))}, and ${tie(hops[1].via, `you and ${first(hops[0].to)}`)}.`
        : `I found you in the Georgia Tech alumni network.`
  const path = /^Co-founder/.test(target.role) ? `starting ${target.company}` : `your role as ${target.role} at ${target.company}`

  return `Hi ${first(target)},\n\n${link} I’m ${me}, and I’d like to hear how you got from ${target.major} at Tech to ${path}.${focus} Would you have 15 minutes for a call in the next two weeks?\n\n${sign}`
}
