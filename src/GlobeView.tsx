import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import { MeshBasicMaterial } from 'three'
import { feature } from 'topojson-client'
import topology from 'world-atlas/land-110m.json'
import { CITY_BY_NAME } from './data'

export interface CityCount {
  name: string
  count: number
}

interface Props {
  cities: CityCount[]
  active: boolean
  focus: string | null
  /** The chain of introductions to the open profile: who is where, in order. */
  stops: { city: string; who: string }[]
  onCity: (name: string) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const topo = topology as any
// Coastlines only: one land shape, split into its landmasses, without Antarctica.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LAND = ((feature(topo, topo.objects.land) as any).features as { geometry: { coordinates: number[][][][] } }[])
  .flatMap((f) => f.geometry.coordinates)
  .filter((poly) => Math.max(...poly[0].map((p) => p[1])) > -60)
  .map((coordinates) => ({ type: 'Feature', geometry: { type: 'Polygon', coordinates } }))

const HOME = { lat: 34, lng: -94 }
const SIDES = ['below', 'above', 'right', 'left']
// Accessors are module-level so the globe never sees a "new" prop and rebuilds its layers.
// A paper globe: honey-tinted sea, cream land, ink coastlines.
const capColor = () => '#fffdf7'
const sideColor = () => 'rgba(0, 0, 0, 0)'
const strokeColor = () => 'rgba(42, 29, 18, 0.8)'
const arcColor = () => '#2a1d12'
// Camera position for a route: centred on its stops, at the closest distance
// from which every stop (and the chip naming it) lands inside the free area
// of the screen and clear of the globe's edge. Short routes zoom in; routes
// that span an ocean pull back.
function frame(names: string[], view: { height: number; reachX: number; reachY: number; nearest: number }) {
  const rad = Math.PI / 180
  const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const unit = (a: number[]) => {
    const len = Math.hypot(a[0], a[1], a[2]) || 1
    return a.map((x) => x / len)
  }
  const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  const vs = names.map((n) => {
    const c = CITY_BY_NAME.get(n)!
    return [Math.cos(c.lat * rad) * Math.cos(c.lng * rad), Math.cos(c.lat * rad) * Math.sin(c.lng * rad), Math.sin(c.lat * rad)]
  })
  // Centre on the midpoint of the two stops furthest apart, so one distant
  // stop is not pushed to the edge by several close together.
  let pair = [vs[0], vs[0]]
  for (const a of vs) for (const b of vs) if (dot(a, b) < dot(pair[0], pair[1])) pair = [a, b]
  const mid = unit([pair[0][0] + pair[1][0], pair[0][1] + pair[1][1], pair[0][2] + pair[1][2]])
  const east = unit(cross([0, 0, 1], mid))
  const north = cross(mid, east)
  const span = Math.max(...vs.map((v) => Math.acos(Math.min(1, dot(v, mid)))))
  const focal = view.height / 2 / Math.tan(25 * rad) // the globe's camera has a 50° field of view
  let altitude = view.nearest
  for (; altitude < 6; altitude += 0.1) {
    const fits = vs.every((v) => {
      const depth = 1 + altitude - dot(v, mid)
      return Math.abs((focal * dot(v, east)) / depth) <= view.reachX && Math.abs((focal * dot(v, north)) / depth) <= view.reachY
    })
    if (fits && span < Math.acos(1 / (1 + altitude)) - 0.22) break
  }
  return { lat: Math.asin(mid[2]) / rad, lng: Math.atan2(mid[1], mid[0]) / rad, altitude }
}

const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const hits = (a: DOMRect, b: DOMRect, pad: number) =>
  a.left < b.right + pad && b.left < a.right + pad && a.top < b.bottom + pad && b.top < a.bottom + pad

export default function GlobeView({ cities, active, focus, stops, onCity }: Props) {
  const ref = useRef<GlobeMethods | undefined>(undefined)
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  const onCityRef = useRef(onCity)
  onCityRef.current = onCity
  const phone = size.w <= 900
  // On a phone the globe gets the area above the sheet to itself.
  const height = phone ? Math.round(size.h * (focus ? 0.29 : active ? 0.4 : 0.46)) : size.h
  const maxLabels = stops.length ? 99 : phone ? 5 : 12

  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])

  const material = useMemo(() => new MeshBasicMaterial({ color: '#f7d68a' }), [])

  const markers = useMemo(() => {
    const scale = phone ? 0.62 : 1
    // With a profile open the map shows only the people on the way to it.
    if (stops.length) {
      const byCity = new Map<string, string[]>()
      for (const s of stops) byCity.set(s.city, [...(byCity.get(s.city) ?? []), s.who])
      return [...byCity].map(([name, who], rank) => {
        const city = CITY_BY_NAME.get(name)!
        const people = who.length > 1 ? `${who.slice(0, -1).join(', ')} and ${who[who.length - 1]}` : who[0]
        return { name, count: 0, label: `${people} · ${name}`, rank, lat: city.lat, lng: city.lng, size: Math.round(13 * scale) }
      })
    }
    const max = Math.max(1, ...cities.map((c) => c.count))
    return cities
      .filter((c) => c.count > 0)
      .map((c, rank) => {
        const city = CITY_BY_NAME.get(c.name)!
        return { ...c, label: '', rank, lat: city.lat, lng: city.lng, size: Math.round((7 + 15 * Math.sqrt(c.count / max)) * scale) }
      })
  }, [cities, stops, phone])

  const arcs = useMemo(() => {
    const route = stops.map((s) => s.city).filter((c, i, all) => i === 0 || c !== all[i - 1])
    return route.slice(1).map((name, i) => {
      const from = CITY_BY_NAME.get(route[i])!
      const to = CITY_BY_NAME.get(name)!
      return { startLat: from.lat, startLng: from.lng, endLat: to.lat, endLng: to.lng }
    })
  }, [stops])

  // Labels are placed in screen space: biggest cities first, each trying four
  // sides of its dot, and a label is dropped (name on hover instead) when it
  // would cover another dot, another label, or slide under a sheet.
  const pending = useRef(0)
  const declutter = useRef(() => {})
  declutter.current = () => {
    const root = box.current
    if (!root) return
    // A city on the very edge of the disc looks like it is floating in space,
    // so anything within a few degrees of the horizon is hidden until it turns into view.
    const pov = ref.current?.pointOfView()
    if (pov) {
      const rad = Math.PI / 180
      const horizon = Math.acos(1 / (1 + pov.altitude)) - 0.16
      for (const m of root.querySelectorAll<HTMLElement>('.marker')) {
        const lat = +m.dataset.lat! * rad
        const dLng = (+m.dataset.lng! - pov.lng) * rad
        const angle = Math.acos(Math.sin(lat) * Math.sin(pov.lat * rad) + Math.cos(lat) * Math.cos(pov.lat * rad) * Math.cos(dLng))
        m.classList.toggle('off', angle > horizon && !m.classList.contains('stop'))
      }
    }
    const all = [...root.querySelectorAll<HTMLElement>('.marker:not(.off)')].sort((a, b) => +a.dataset.rank! - +b.dataset.rank!)
    const dots = all.map((m) => m.querySelector('.dot')!.getBoundingClientRect())
    // Before the first frame is painted every marker sits at the origin; wait for real positions.
    if (all.length && dots.every((d) => d.width === 0 || (d.left <= 0 && d.top <= 0))) {
      pending.current = window.setTimeout(() => declutter.current(), 250)
      return
    }
    const sheets = [...document.querySelectorAll('.sheet')].map((s) => s.getBoundingClientRect())
    const taken: DOMRect[] = []
    all.forEach((m, i) => {
      const label = m.querySelector<HTMLElement>('.mlabel')!
      m.classList.add('labeled')
      const tryAt = (gap: string) =>
        SIDES.some((side) => {
          m.dataset.side = side
          m.style.setProperty('--gap', gap)
          const r = label.getBoundingClientRect()
          if (r.left < 4 || r.right > window.innerWidth - 4 || r.top < 4) return false
          if (dots.some((d, j) => j !== i && hits(r, d, 2)) || taken.some((t) => hits(r, t, 6)) || sheets.some((s) => hits(r, s, 4))) return false
          taken.push(r)
          return true
        })
      // The biggest city may reach further out to find room for its name.
      const fits = taken.length < maxLabels && (tryAt('4px') || (i === 0 && (tryAt('16px') || tryAt('30px'))))
      // A stop on a route is always named, even if its chip has to sit over something.
      if (!fits && !m.classList.contains('stop')) {
        m.classList.remove('labeled')
        m.dataset.side = 'below'
        m.style.setProperty('--gap', '4px')
      }
    })
  }

  const settle = () => {
    clearTimeout(pending.current)
    pending.current = window.setTimeout(() => declutter.current(), 90)
  }

  // Markers come and go as the globe turns, so re-place labels whenever they do.
  useEffect(() => {
    if (!box.current) return
    const seen = new MutationObserver((changes) => {
      if (changes.some((c) => c.type === 'childList')) settle()
    })
    seen.observe(box.current, { childList: true, subtree: true })
    window.addEventListener('resize', settle)
    return () => {
      seen.disconnect()
      window.removeEventListener('resize', settle)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Marker visibility is recomputed on control changes, so instant camera
  // moves and fresh markers have to announce themselves.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const announce = () => (ref.current?.controls() as any)?.dispatchEvent({ type: 'change' })

  const look = (target: { lat: number; lng: number }, altitude: number, ms: number) => {
    const duration = calm() ? 0 : ms
    ref.current?.pointOfView({ ...target, altitude }, duration)
    setTimeout(announce, duration + 30)
  }

  useEffect(() => {
    const timers = [60, 400, 1300].map((ms) => setTimeout(announce, ms))
    // Two frames on, the new markers have been positioned and can be labelled.
    const frame = requestAnimationFrame(() => requestAnimationFrame(settle))
    return () => {
      timers.forEach(clearTimeout)
      cancelAnimationFrame(frame)
    }
  }, [markers, height, focus])

  const far = phone ? 2.2 : 1.8
  const settleRef = useRef(settle)
  settleRef.current = settle
  const lookRef = useRef(look)
  lookRef.current = look
  const farRef = useRef(far)
  farRef.current = far
  const top = markers[0]?.name
  // Where the camera sits for the open profile's route, if there is one.
  const routeView = useMemo(() => {
    if (!stops.length) return null
    // Room for the furthest stop: half the space between the sheets (or the
    // phone's globe band), less room for the chip that names it.
    const free = phone ? size.w : size.w - 892
    return frame(stops.map((s) => s.city), {
      height,
      reachX: Math.max(50, free / 2 - 80),
      reachY: Math.max(40, height / 2 - 42),
      nearest: phone ? 2 : 1.2,
    })
  }, [stops, phone, size.w, height])

  useEffect(() => {
    if (routeView) {
      look(routeView, routeView.altitude, 1000)
      return
    }
    const target = active && top ? CITY_BY_NAME.get(top) : HOME
    if (target) look(target, far, 1000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeView, active, top, far])

  const makeMarker = useCallback((d: object) => {
    const m = d as { name: string; count: number; label: string; rank: number; size: number; lat: number; lng: number }
    const el = document.createElement('button')
    el.className = m.label ? 'marker stop' : 'marker'
    el.dataset.rank = String(m.rank)
    el.dataset.side = 'below'
    el.dataset.lat = String(m.lat)
    el.dataset.lng = String(m.lng)
    el.style.pointerEvents = 'auto'
    el.style.setProperty('--r', `${m.size / 2}px`)
    const dot = document.createElement('span')
    dot.className = 'dot'
    dot.style.width = dot.style.height = `${m.size}px`
    const label = document.createElement('span')
    label.className = 'mlabel'
    label.textContent = m.label || m.name
    if (!m.label) {
      const count = document.createElement('i')
      count.textContent = String(m.count)
      label.append(count)
    }
    el.append(dot, label)
    el.setAttribute('aria-label', m.label ? m.label.replace(' · ', ', ') : `${m.name}, ${m.count} alumni. Narrow the search to this city`)
    el.onclick = () => onCityRef.current(m.name)
    return el
  }, [])

  const onReady = useCallback(() => {
    const controls = ref.current?.controls()
    if (controls) {
      controls.autoRotate = false
      controls.minDistance = 160
      controls.maxDistance = 720
      controls.addEventListener('change', () => settleRef.current())
    }
    lookRef.current(HOME, farRef.current, 0)
  }, [])

  return (
    <div className="globe" ref={box}>
      <Globe
        ref={ref}
        width={size.w}
        height={height}
        backgroundColor="rgba(0,0,0,0)"
        globeMaterial={material}
        showAtmosphere={false}
        onGlobeReady={onReady}
        polygonsData={LAND}
        polygonAltitude={0.004}
        polygonCapColor={capColor}
        polygonSideColor={sideColor}
        polygonStrokeColor={strokeColor}
        arcsData={arcs}
        arcColor={arcColor}
        arcStroke={routeView ? 0.2 * (1 + routeView.altitude) : 0.5}
        arcAltitudeAutoScale={0.35}
        htmlElementsData={markers}
        htmlAltitude={0.012}
        htmlElement={makeMarker}
      />
    </div>
  )
}
