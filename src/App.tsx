import { Check, ChevronRight, Copy, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import GlobeView from './GlobeView'
import { ALUMNI, MAJOR_ABBR, ME, type OpenTo, type Person } from './data'
import { connection, degree, pathTo, shortConnection, tie } from './graph'
import { draftIntro } from './intro'
import { search, searchPlan, tally, type Hit, type Plan } from './search'

const OPEN_LABEL: Record<OpenTo, string> = {
  coffee: 'coffee chats',
  referrals: 'referrals',
  mentoring: 'mentoring',
  hiring: 'hiring',
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const ordinal = (d: number) => (d === 1 ? '1st' : d === 2 ? '2nd' : d === 3 ? '3rd' : `${d}th`)
const first = (p: Person) => p.name.split(' ')[0]
const classOf = (p: Person) => `${MAJOR_ABBR[p.major] ?? p.major} ’${String(p.year).slice(2)}`
const list = (items: string[]) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`

const RECENT_KEY = 'cairn.recent'
function loadRecent(): string[] {
  try {
    // 'swarm.recent' is the key from before the rename.
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? localStorage.getItem('swarm.recent') ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 5) : []
  } catch {
    return []
  }
}

function Degree({ id }: { id: number }) {
  const d = degree(id)
  if (d < 1) return null
  return (
    <span className={`deg ${d === 1 ? 'near' : ''}`} title={`${ordinal(d)}-degree connection`}>
      {ordinal(d)}
    </span>
  )
}

// One suggested person per week: a close, available alum who shares the
// student's interests. Changes every Monday.
function weeklyMatch(): Person {
  const week = Math.floor(Date.now() / (7 * 864e5))
  const pool = ALUMNI.filter(
    (p) => degree(p.id) === 1 && p.chatsLeft > 0 && p.openTo.includes('coffee') && p.skills.some((s) => /robot|machine learning|autonomy/.test(s)),
  )
  return pool[week % pool.length] ?? ALUMNI[0]
}

export default function App() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'people' | 'companies' | 'cities'>('people')
  const [by, setBy] = useState<'cities' | 'companies'>('cities')
  const [selected, setSelected] = useState<Person | null>(null)
  const [sent, setSent] = useState<Set<number>>(new Set())
  // The topic a profile was opened under; the draft note keeps it even if the search changes.
  const [openedFor, setOpenedFor] = useState('')
  const [recent, setRecent] = useState(loadRecent)
  const input = useRef<HTMLInputElement>(null)

  const q = query.trim()

  // Model-assisted search: results appear instantly from the built-in parser,
  // then are replaced by the model's reading of the question once it arrives.
  const [gpt, setGpt] = useState(false)
  const [ai, setAi] = useState<{ q: string; plan: Plan } | null>(null)
  const [searching, setSearching] = useState(false)
  const plans = useRef(new Map<string, Plan>())

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => setGpt(!!d.enabled))
      .catch(() => setGpt(false))
  }, [])

  useEffect(() => {
    if (!gpt || q.length < 4) return setSearching(false)
    const cached = plans.current.get(q)
    if (cached) {
      setAi({ q, plan: cached })
      return setSearching(false)
    }
    const ctl = new AbortController()
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q }),
          signal: ctl.signal,
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error)
        plans.current.set(q, d.plan)
        setAi({ q, plan: d.plan })
      } catch {
        // The built-in parser's results stay on screen.
      }
      if (!ctl.signal.aborted) setSearching(false)
    }, 450)
    return () => {
      clearTimeout(timer)
      ctl.abort()
    }
  }, [q, gpt])

  const result = useMemo(() => (ai && ai.q === q ? searchPlan(ai.plan) : search(q)), [q, ai])
  const hits = result.hits
  const cities = useMemo(() => tally(hits, (p) => p.city), [hits])
  const companies = useMemo(() => tally(hits, (p) => p.company), [hits])
  const match = useMemo(weeklyMatch, [])
  const topic = result.understood
    .filter((u) => u.kind === 'topic')
    .map((u) => u.label)
    .join(' ')

  // With a profile open, the globe shows the chain of introductions to it.
  const stops = useMemo(
    () => (selected ? [{ city: ME.city, who: 'You' }, ...pathTo(selected.id).map((h) => ({ city: h.to.city, who: first(h.to) }))] : []),
    [selected],
  )

  useEffect(() => setTab('people'), [q])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        input.current?.focus()
      }
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const saveRecent = (next: string[]) => {
    setRecent(next)
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {
      // Private windows may refuse storage; recents then last for this visit only.
    }
  }
  const remember = () => {
    if (q && hits.length) saveRecent([q, ...recent.filter((r) => r.toLowerCase() !== q.toLowerCase())].slice(0, 5))
  }
  const open = (p: Person) => {
    remember()
    setOpenedFor(topic)
    setSelected(p)
  }
  // What the search left out, said plainly beside what it applied.
  const notes = [
    result.ignored.length > 0 && `Ignoring ${list(result.ignored.map((w) => `“${w}”`))}.`,
    result.missing.length > 0 && `No one here for ${list(result.missing.map((w) => `“${w}”`))}.`,
  ].filter(Boolean) as string[]
  // Narrowing swaps out any place or company already in the question rather
  // than stacking a second one on the end.
  const narrow = (kind: 'city' | 'company', name: string) => {
    let base = q.replace(/[?.!\s]+$/, '')
    for (const u of result.understood)
      if (u.kind === kind) base = base.replace(new RegExp(`\\s*\\b(?:in|at)?\\s*${u.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'), '')
    setQuery(`${base.trim()} ${kind === 'city' ? 'in' : 'at'} ${name}`.trim())
  }
  const narrowTo = (city: string) => narrow('city', city)

  return (
    <div className={`app ${selected ? 'has-profile' : ''}`} style={{ '--shift': selected ? '-10px' : '0px' } as CSSProperties}>
      <header className="top">
        {/* Three stacked stones; the top one is the newest, still honey-gold. */}
        <svg viewBox="0 0 64 64" width="30" height="30" stroke="var(--ink)" strokeWidth="3.4" aria-hidden="true">
          <ellipse cx="32" cy="48" rx="21" ry="8" fill="var(--surface)" />
          <ellipse cx="29" cy="31" rx="14.5" ry="7" fill="var(--surface)" transform="rotate(-4 29 31)" />
          <ellipse cx="34" cy="15" rx="8" ry="6" fill="var(--honey)" transform="rotate(5 34 15)" />
        </svg>
        <strong>Cairn</strong>
        <span>Georgia Tech alumni</span>
      </header>

      <main className={`sheet results ${q ? 'searching' : ''}`}>
        <div className="search">
          {!q && <h1 className="hello">Who do you want to meet, {first(ME)}?</h1>}
          <label className="field">
            <Search size={18} aria-hidden="true" />
            <input
              ref={input}
              autoFocus={window.matchMedia('(hover: hover) and (pointer: fine)').matches}
              spellCheck={false}
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && remember()}
              placeholder="Try “founders in Atlanta open to a chat”"
              aria-label="Search alumni"
            />
            {query ? (
              <button className="icon-btn" onClick={() => setQuery('')} aria-label="Clear search">
                <X size={16} />
              </button>
            ) : (
              <kbd aria-hidden="true">/</kbd>
            )}
          </label>

          {q && hits.length > 0 && (result.understood.length > 0 || notes.length > 0 || searching) && (
            <p className="understood">
              <span>
                {result.understood.length > 0 && (
                  <>
                    <em>{result.relaxed ? 'Matching any of' : 'Matching'}</em> {result.understood.map((u) => u.label).join(' · ')}
                  </>
                )}
                {notes.length > 0 && <small>{notes.join(' ')}</small>}
              </span>
              {searching && (
                <span className="busy" role="status">
                  Searching…
                </span>
              )}
            </p>
          )}
        </div>

        {!q ? (
          <div className="scroll home">
            <section>
              <h2>Someone to meet this week</h2>
              <button className="feature" onClick={() => {
                  setOpenedFor('')
                  setSelected(match)
                }}>
                <span className="body">
                  <strong>{match.name}</strong>
                  <span>
                    {match.role} · {match.company}
                  </span>
                  <span className="quiet">{connection(match.id)}</span>
                </span>
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </section>

            {recent.length > 0 && (
              <section>
                <div className="split">
                  <h2>Recent searches</h2>
                  <button className="text-btn" onClick={() => saveRecent([])}>
                    Clear
                  </button>
                </div>
                <ul className="asks">
                  {recent.map((r) => (
                    <li key={r}>
                      <button onClick={() => setQuery(r)}>{r}</button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <div className="split">
                <h2>{ALUMNI.length.toLocaleString()} alumni by</h2>
                <Segmented
                  label="Group alumni by"
                  value={by}
                  onChange={setBy}
                  options={[
                    ['cities', 'City'],
                    ['companies', 'Company'],
                  ]}
                />
              </div>
              <Ranked
                bars
                items={(by === 'cities' ? cities : companies).slice(0, 8)}
                onPick={(n) => setQuery(by === 'cities' ? `Who is in ${n}?` : `Who works at ${n}?`)}
              />
            </section>

            <p className="foot">Every profile here is made-up demo data. Cairn is an independent student project, not affiliated with Georgia Tech.</p>
          </div>
        ) : !hits.length ? (
          <div className="scroll empty">
            <strong>No one matches “{q}”</strong>
            <p>
              Try a place, a company or a field, such as{' '}
              <button className="link" onClick={() => setQuery('robotics in Austin')}>
                robotics in Austin
              </button>
              .
            </p>
          </div>
        ) : (
          <>
            <div className="tabs" role="tablist" aria-label="Results">
              {(
                [
                  ['people', 'People', hits.length],
                  ['companies', 'Companies', companies.length],
                  ['cities', 'Cities', cities.length],
                ] as const
              ).map(([id, label, n]) => (
                <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
                  {label} <span>{n}</span>
                </button>
              ))}
            </div>
            <div className="scroll" role="tabpanel">
              {tab === 'people' && (
                <ul className="people">
                  {hits.slice(0, 60).map((h) => (
                    <li key={h.person.id}>
                      <PersonRow hit={h} active={selected?.id === h.person.id} onClick={() => open(h.person)} />
                    </li>
                  ))}
                </ul>
              )}
              {tab === 'people' && hits.length > 60 && <p className="foot">Showing the closest 60 of {hits.length}. Add a detail to narrow it down.</p>}
              {tab === 'companies' && <Ranked items={companies} onPick={(n) => narrow('company', n)} />}
              {tab === 'cities' && <Ranked items={cities} onPick={(n) => narrow('city', n)} />}
            </div>
          </>
        )}
      </main>

      {selected && (
        <Profile
          key={selected.id}
          p={selected}
          topic={openedFor}
          sent={sent.has(selected.id)}
          onSend={() => setSent((s) => new Set(s).add(selected.id))}
          onClose={() => setSelected(null)}
          onOpen={setSelected}
        />
      )}

      {/* Last in the DOM so the keyboard reaches search before the map. */}
      <GlobeView cities={cities} active={!!q} focus={selected?.city ?? null} stops={stops} onCity={narrowTo} />
    </div>
  )
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: [T, ReactNode][]
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  )
}

function Ranked({ items, onPick, bars }: { items: { name: string; count: number }[]; onPick: (n: string) => void; bars?: boolean }) {
  const max = Math.max(1, ...items.map((i) => i.count))
  return (
    <ol className="ranked">
      {items.map((i) => (
        <li key={i.name}>
          <button onClick={() => onPick(i.name)}>
            <span className="name">{i.name}</span>
            <span className="count">{i.count}</span>
            {bars && (
              <span className="track" aria-hidden="true">
                <span style={{ width: `${(i.count / max) * 100}%` }} />
              </span>
            )}
          </button>
        </li>
      ))}
    </ol>
  )
}

function PersonRow({ hit, active, onClick }: { hit: Hit; active: boolean; onClick: () => void }) {
  const p = hit.person
  const link = shortConnection(p.id)
  return (
    <button className={`person ${active ? 'on' : ''}`} onClick={onClick} aria-current={active || undefined}>
      <span className="line">
        <strong>{p.name}</strong>
        <Degree id={p.id} />
      </span>
      <span>
        {p.role} · {p.company}
      </span>
      <span className="quiet">
        {p.city} · {classOf(p)}
        {link && ` · ${link}`}
      </span>
    </button>
  )
}

function Profile({
  p,
  topic,
  sent,
  onSend,
  onClose,
  onOpen,
}: {
  p: Person
  topic: string
  sent: boolean
  onSend: () => void
  onClose: () => void
  onOpen: (p: Person) => void
}) {
  const hops = useMemo(() => pathTo(p.id), [p.id])
  const [via, setVia] = useState(false)
  const [text, setText] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const canVia = hops.length > 1
  const draft = text ?? draftIntro(p, hops, via && canVia, topic)
  const recipient = via && canVia ? hops[0].to : p
  const available = p.openTo.length > 0 && p.chatsLeft > 0
  const blocked = !available && recipient.id === p.id
  const campus = [...p.clubs, ...(p.lab ? [`the ${p.lab}`] : [])]
  const asks = p.openTo.filter((o) => o !== 'hiring').map((o) => OPEN_LABEL[o])

  return (
    <aside className="sheet profile" aria-label={`${p.name}’s profile`}>
      <header className="identity">
        <div>
          <h1>{p.name}</h1>
          <p>
            {p.role} at {p.company}
          </p>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close profile">
          <X size={18} />
        </button>
      </header>

      <div className="scroll">
        <dl className="facts">
          <div>
            <dt>Based in</dt>
            <dd>{p.city}</dd>
          </div>
          <div>
            <dt>Studied</dt>
            <dd>
              {p.degree} {MAJOR_ABBR[p.major] ?? p.major}
            </dd>
          </div>
          <div>
            <dt>Class of</dt>
            <dd>{p.year}</dd>
          </div>
        </dl>

        <p className="about">
          Works on {list(p.skills.slice(0, 4))}.
          {p.prev.length > 0 && ` Previously at ${list(p.prev)}.`}
          {campus.length > 0 && ` On campus: ${list(campus)}.`}
        </p>

        <p className={`status ${available ? 'open' : ''}`}>
          <i aria-hidden="true" />
          {available ? (
            <>
              <span>
                {asks.length > 0 ? `Open to ${list(asks)}` : 'Team is hiring'}
                {asks.length > 0 && p.openTo.includes('hiring') && '; team is hiring'}
              </span>
              <small>
                Taking {p.chatsLeft} more {p.chatsLeft === 1 ? 'note' : 'notes'} this month
              </small>
            </>
          ) : (
            <span>Not taking notes this month</span>
          )}
        </p>

        <section className="route">
          <h2>How you’re connected</h2>
          {hops.length ? (
            <ol>
              <li>
                <strong>You</strong>
              </li>
              {hops.map((h, i) => (
                <li key={i}>
                  <span className="why">{cap(i > 0 ? tie(h.via, `${first(h.from)} and ${first(h.to)}`) : tie(h.via, 'you', first(h.to)))}</span>
                  {h.to.id === p.id ? (
                    <strong>{h.to.name}</strong>
                  ) : (
                    <button className="link" onClick={() => onOpen(h.to)}>
                      {h.to.name}
                    </button>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="quiet">No shared clubs, labs or employers yet.</p>
          )}
        </section>

        <section className="composer">
          <div className="split">
            <h2>
              <label htmlFor="note">Your note</label>
            </h2>
            {canVia && (
              <Segmented
                label="Who to write to"
                value={via ? 'via' : 'direct'}
                onChange={(v) => {
                  setVia(v === 'via')
                  setText(null)
                }}
                options={[
                  ['direct', `To ${first(p)}`],
                  ['via', `Ask ${first(hops[0].to)} first`],
                ]}
              />
            )}
          </div>
          <textarea id="note" readOnly={sent} value={draft} onChange={(e) => setText(e.target.value)} rows={7} />
        </section>
      </div>

      <footer className="send">
        <div className="actions">
          <button className={`btn primary ${sent ? 'sent' : ''}`} disabled={sent || blocked} onClick={onSend}>
            {sent ? (
              <>
                <Check size={16} aria-hidden="true" /> Marked as sent
              </>
            ) : (
              'Send note'
            )}
          </button>
          <button
            className="btn"
            onClick={() => {
              navigator.clipboard?.writeText(draft)
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            }}
          >
            {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="foot" role="status">
          {sent
            ? 'This is a demo, so nothing is delivered.'
            : blocked
              ? `${first(p)} isn’t taking notes this month. You can still copy yours.`
              : `${first(recipient)} sees your note and decides whether to reply.`}
        </p>
      </footer>
    </aside>
  )
}
