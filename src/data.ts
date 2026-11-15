// Synthetic alumni dataset, generated deterministically in the browser.
// Every profile is fictional. Swap this module for a real data source later.

export type OpenTo = 'coffee' | 'referrals' | 'mentoring' | 'hiring'

export interface Person {
  id: number
  name: string
  year: number
  major: string
  degree: 'BS' | 'MS' | 'PhD'
  clubs: string[]
  lab?: string
  dorm: string
  company: string
  role: string
  industry: string
  city: string
  prev: string[]
  skills: string[]
  openTo: OpenTo[]
  chatsLeft: number
  bio: string
  hue: number
}

export interface City {
  name: string
  lat: number
  lng: number
  w: number
  aliases: string[]
}

export const CITIES: City[] = [
  { name: 'Atlanta', lat: 33.749, lng: -84.388, w: 30, aliases: ['atl'] },
  { name: 'San Francisco', lat: 37.774, lng: -122.419, w: 12, aliases: ['sf', 'bay area', 'silicon valley'] },
  { name: 'New York', lat: 40.713, lng: -74.006, w: 11, aliases: ['nyc', 'new york city', 'manhattan'] },
  { name: 'Seattle', lat: 47.606, lng: -122.332, w: 9, aliases: [] },
  { name: 'Austin', lat: 30.267, lng: -97.743, w: 6, aliases: [] },
  { name: 'Boston', lat: 42.36, lng: -71.059, w: 5, aliases: [] },
  { name: 'Los Angeles', lat: 34.052, lng: -118.244, w: 5, aliases: ['la'] },
  { name: 'Washington, DC', lat: 38.907, lng: -77.037, w: 5, aliases: ['dc', 'washington dc', 'washington'] },
  { name: 'Chicago', lat: 41.878, lng: -87.63, w: 4, aliases: [] },
  { name: 'Dallas', lat: 32.777, lng: -96.797, w: 4, aliases: [] },
  { name: 'Houston', lat: 29.76, lng: -95.37, w: 4, aliases: [] },
  { name: 'Denver', lat: 39.739, lng: -104.99, w: 3, aliases: [] },
  { name: 'Charlotte', lat: 35.227, lng: -80.843, w: 3, aliases: [] },
  { name: 'Raleigh', lat: 35.78, lng: -78.638, w: 3, aliases: [] },
  { name: 'San Diego', lat: 32.716, lng: -117.161, w: 2, aliases: [] },
  { name: 'Miami', lat: 25.762, lng: -80.192, w: 2, aliases: [] },
  { name: 'Huntsville', lat: 34.73, lng: -86.586, w: 2, aliases: [] },
  { name: 'London', lat: 51.507, lng: -0.128, w: 2, aliases: [] },
  { name: 'Bangalore', lat: 12.972, lng: 77.594, w: 2, aliases: ['bengaluru'] },
  { name: 'Toronto', lat: 43.653, lng: -79.383, w: 1.5, aliases: [] },
  { name: 'Seoul', lat: 37.566, lng: 126.978, w: 1.5, aliases: [] },
  { name: 'Shanghai', lat: 31.23, lng: 121.474, w: 1.5, aliases: [] },
  { name: 'Singapore', lat: 1.352, lng: 103.82, w: 1.5, aliases: [] },
  { name: 'Tokyo', lat: 35.676, lng: 139.65, w: 1, aliases: [] },
  { name: 'Berlin', lat: 52.52, lng: 13.405, w: 1, aliases: [] },
  { name: 'Paris', lat: 48.857, lng: 2.352, w: 1, aliases: [] },
  { name: 'Sydney', lat: -33.869, lng: 151.209, w: 0.7, aliases: [] },
  { name: 'Dubai', lat: 25.205, lng: 55.271, w: 0.7, aliases: [] },
  { name: 'São Paulo', lat: -23.55, lng: -46.633, w: 0.6, aliases: ['sao paulo'] },
]

export const CITY_BY_NAME = new Map(CITIES.map((c) => [c.name, c]))

interface Company {
  name: string
  industry: string
  cities: string[]
  aliases?: string[]
  focus?: string[]
}

const co = (name: string, industry: string, cities: string[], aliases?: string[], focus?: string[]): Company => ({
  name,
  industry,
  cities,
  aliases,
  focus,
})

export const COMPANIES: Company[] = [
  co('Google', 'Tech', ['San Francisco', 'New York', 'Seattle', 'Atlanta', 'Austin', 'London']),
  co('Microsoft', 'Tech', ['Seattle', 'Atlanta', 'San Francisco', 'Bangalore']),
  co('Apple', 'Tech', ['San Francisco', 'Austin', 'San Diego']),
  co('Amazon', 'Tech', ['Seattle', 'New York', 'Austin', 'Atlanta']),
  co('Meta', 'Tech', ['San Francisco', 'New York', 'Seattle', 'London']),
  co('NVIDIA', 'Tech', ['San Francisco', 'Austin']),
  co('Stripe', 'Tech', ['San Francisco', 'New York', 'Seattle']),
  co('Salesforce', 'Tech', ['San Francisco', 'Atlanta']),
  co('Mailchimp', 'Tech', ['Atlanta']),
  co('Anthropic', 'Tech', ['San Francisco', 'New York', 'London']),
  co('Databricks', 'Tech', ['San Francisco', 'Seattle']),
  co('Samsung', 'Tech', ['Seoul', 'Austin']),
  co('Shopify', 'Tech', ['Toronto']),
  co('Grab', 'Tech', ['Singapore']),
  co('ByteDance', 'Tech', ['Shanghai', 'Singapore']),
  co('Atlassian', 'Tech', ['Sydney', 'Austin']),
  co('Infosys', 'Tech', ['Bangalore']),
  co('NCR Voyix', 'Tech', ['Atlanta'], ['ncr']),
  co('Lockheed Martin', 'Aerospace', ['Atlanta', 'Dallas', 'Denver'], ['lockheed']),
  co('Boeing', 'Aerospace', ['Seattle', 'Huntsville']),
  co('SpaceX', 'Aerospace', ['Los Angeles', 'Austin']),
  co('NASA', 'Aerospace', ['Houston', 'Huntsville', 'Washington, DC']),
  co('Blue Origin', 'Aerospace', ['Seattle', 'Huntsville']),
  co('Northrop Grumman', 'Aerospace', ['Los Angeles', 'Washington, DC'], ['northrop']),
  co('Delta Air Lines', 'Aerospace', ['Atlanta'], ['delta']),
  co('Airbus', 'Aerospace', ['Paris']),
  co('Georgia Tech Research Institute', 'Aerospace', ['Atlanta', 'Huntsville'], ['gtri']),
  co('Goldman Sachs', 'Finance', ['New York', 'Dallas', 'London'], ['goldman']),
  co('JPMorgan', 'Finance', ['New York', 'Chicago'], ['jp morgan', 'jpmorgan chase']),
  co('Capital One', 'Finance', ['Washington, DC', 'New York']),
  co('Jane Street', 'Finance', ['New York', 'London']),
  co('Truist', 'Finance', ['Atlanta', 'Charlotte']),
  co('Bank of America', 'Finance', ['Charlotte', 'New York'], ['bofa']),
  co('Citadel', 'Finance', ['Chicago', 'Miami']),
  co('Nubank', 'Finance', ['São Paulo']),
  co('McKinsey', 'Consulting', ['Atlanta', 'New York', 'Chicago', 'Dubai']),
  co('BCG', 'Consulting', ['Atlanta', 'Boston', 'Dallas'], ['boston consulting group']),
  co('Deloitte', 'Consulting', ['Atlanta', 'Washington, DC', 'Charlotte']),
  co('Accenture', 'Consulting', ['Atlanta', 'Chicago', 'Raleigh']),
  co('Southern Company', 'Energy & Climate', ['Atlanta']),
  co('Tesla', 'Energy & Climate', ['Austin', 'San Francisco']),
  co('ExxonMobil', 'Energy & Climate', ['Houston'], ['exxon']),
  co('NextEra Energy', 'Energy & Climate', ['Miami'], ['nextera']),
  co('Form Energy', 'Energy & Climate', ['Boston']),
  co('Rivian', 'Energy & Climate', ['Atlanta', 'Los Angeles']),
  co('Siemens', 'Energy & Climate', ['Berlin', 'Atlanta']),
  co('CDC', 'Healthcare & Bio', ['Atlanta']),
  co('Medtronic', 'Healthcare & Bio', ['Denver', 'Boston']),
  co('Moderna', 'Healthcare & Bio', ['Boston']),
  co('Intuitive Surgical', 'Healthcare & Bio', ['San Francisco', 'Atlanta'], ['intuitive']),
  co('Emory Healthcare', 'Healthcare & Bio', ['Atlanta'], ['emory']),
  co('Illumina', 'Healthcare & Bio', ['San Diego']),
  co('Boston Dynamics', 'Robotics', ['Boston']),
  co('Waymo', 'Robotics', ['San Francisco', 'Austin']),
  co('Zipline', 'Robotics', ['San Francisco']),
  co('Amazon Robotics', 'Robotics', ['Boston', 'Seattle']),
  co('Toyota Research Institute', 'Robotics', ['Tokyo', 'Boston'], ['toyota']),
  co('Home Depot', 'Retail & Logistics', ['Atlanta'], ['the home depot']),
  co('Coca-Cola', 'Retail & Logistics', ['Atlanta'], ['coke']),
  co('UPS', 'Retail & Logistics', ['Atlanta']),
  co('Walmart', 'Retail & Logistics', ['Dallas', 'San Francisco']),
  co('Emirates', 'Retail & Logistics', ['Dubai']),
  co('Kimley-Horn', 'Infrastructure', ['Atlanta', 'Raleigh', 'Dallas']),
  co('AECOM', 'Infrastructure', ['Los Angeles', 'Dallas', 'Denver']),
  co('Peachtree Ventures', 'Venture Capital', ['Atlanta']),
  co('Northside Capital', 'Venture Capital', ['San Francisco', 'New York']),
  co('Whistle Fund', 'Venture Capital', ['Atlanta', 'Austin']),
  // Fictional startups
  co('Kudzu Robotics', 'Startup', ['Atlanta'], [], ['robotics', 'warehouse automation']),
  co('Tidewater AI', 'Startup', ['San Francisco'], [], ['machine learning', 'LLMs']),
  co('Fernbank Health', 'Startup', ['Atlanta'], [], ['digital health', 'medical devices']),
  co('Ridgeline Energy', 'Startup', ['Denver'], [], ['climate tech', 'energy storage']),
  co('Ponce Labs', 'Startup', ['Atlanta'], [], ['developer tools', 'infrastructure']),
  co('Lumen Orbital', 'Startup', ['Los Angeles'], [], ['space', 'satellites']),
  co('Gridwise', 'Startup', ['Austin'], [], ['climate tech', 'grid software']),
  co('Mosaic Pay', 'Startup', ['New York'], [], ['fintech', 'payments']),
  co('Hollis Bio', 'Startup', ['Boston'], [], ['biotech', 'drug discovery']),
  co('Cascade Freight', 'Startup', ['Seattle'], [], ['logistics', 'supply chain']),
]

const A = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Aerospace Engineering',
  'Industrial Engineering',
  'Biomedical Engineering',
  'Computer Engineering',
  'Chemical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Industrial Design',
  'Materials Science',
  'Physics',
  'Mathematics',
] as const
const [CS, EE, MECH, AE, IE, BME, CMPE, CHBE, CE, BA, ID, MSE, PHYS, MATH] = A

export const MAJORS: { name: string; w: number; aliases: string[] }[] = [
  { name: CS, w: 22, aliases: ['cs'] },
  { name: EE, w: 9, aliases: ['ee', 'ece'] },
  { name: MECH, w: 12, aliases: ['meche'] },
  { name: AE, w: 8, aliases: ['ae'] },
  { name: IE, w: 11, aliases: ['isye', 'ie', 'industrial and systems engineering'] },
  { name: BME, w: 7, aliases: ['bme'] },
  { name: CMPE, w: 6, aliases: ['cmpe', 'compe'] },
  { name: CHBE, w: 5, aliases: ['chbe', 'cheme'] },
  { name: CE, w: 4, aliases: [] },
  { name: BA, w: 8, aliases: ['business', 'scheller'] },
  { name: ID, w: 2, aliases: [] },
  { name: MSE, w: 2, aliases: ['mse'] },
  { name: PHYS, w: 2, aliases: [] },
  { name: MATH, w: 2, aliases: ['math'] },
]

interface RoleDef {
  t: string
  area: string
  majors: string[]
  inds: string[]
  skills: string[]
  fixed?: boolean
}

const ROLES: RoleDef[] = [
  { t: 'Software Engineer', area: 'Engineering', majors: [CS, CMPE, MATH, EE], inds: ['Tech', 'Finance', 'Robotics', 'Aerospace', 'Startup'], skills: ['distributed systems', 'backend', 'Python', 'Go', 'React', 'infrastructure', 'APIs', 'cloud'] },
  { t: 'Machine Learning Engineer', area: 'Machine Learning', majors: [CS, CMPE, MATH, EE], inds: ['Tech', 'Robotics', 'Healthcare & Bio', 'Startup'], skills: ['machine learning', 'deep learning', 'PyTorch', 'LLMs', 'computer vision', 'MLOps', 'recommendation systems'] },
  { t: 'Research Scientist', area: 'AI Research', majors: [CS, MATH, PHYS], inds: ['Tech', 'Robotics'], skills: ['AI research', 'reinforcement learning', 'NLP', 'machine learning', 'LLMs', 'interpretability'] },
  { t: 'Product Manager', area: 'Product', majors: [CS, IE, BA, ID], inds: ['Tech', 'Startup', 'Retail & Logistics', 'Finance'], skills: ['product strategy', 'roadmapping', 'user research', 'analytics', 'growth', 'go-to-market'] },
  { t: 'Robotics Engineer', area: 'Robotics', majors: [MECH, EE, CS, AE, CMPE], inds: ['Robotics', 'Aerospace', 'Startup'], skills: ['robotics', 'controls', 'ROS', 'perception', 'motion planning', 'autonomy', 'mechatronics'] },
  { t: 'Hardware Engineer', area: 'Hardware', majors: [EE, CMPE], inds: ['Tech', 'Robotics'], skills: ['chip design', 'FPGA', 'embedded systems', 'PCB design', 'semiconductors', 'signal processing'] },
  { t: 'Propulsion Engineer', area: 'Propulsion', majors: [AE, MECH], inds: ['Aerospace'], skills: ['propulsion', 'rockets', 'CFD', 'combustion', 'space', 'test engineering'] },
  { t: 'Systems Engineer', area: 'Systems Engineering', majors: [AE, EE, IE, MECH], inds: ['Aerospace', 'Energy & Climate'], skills: ['systems engineering', 'requirements', 'integration', 'avionics', 'space', 'aircraft design'] },
  { t: 'Flight Software Engineer', area: 'Flight Software', majors: [AE, CS, CMPE], inds: ['Aerospace'], skills: ['flight software', 'embedded systems', 'C++', 'GNC', 'space', 'satellites'] },
  { t: 'Quantitative Researcher', area: 'Quantitative Research', majors: [MATH, CS, PHYS, IE], inds: ['Finance'], skills: ['quant', 'trading', 'statistics', 'Python', 'market making', 'probability'] },
  { t: 'Investment Banker', area: 'Investment Banking', majors: [BA, IE], inds: ['Finance'], skills: ['investment banking', 'M&A', 'financial modeling', 'valuation', 'capital markets'] },
  { t: 'Consultant', area: 'Strategy', majors: [IE, BA, CHBE, MECH, CE], inds: ['Consulting'], skills: ['strategy', 'operations', 'case interviews', 'client management', 'analytics', 'transformation'] },
  { t: 'Supply Chain Manager', area: 'Supply Chain', majors: [IE, BA], inds: ['Retail & Logistics'], skills: ['supply chain', 'logistics', 'optimization', 'operations research', 'forecasting', 'procurement'] },
  { t: 'Data Scientist', area: 'Data Science', majors: [IE, MATH, CS, PHYS], inds: ['Tech', 'Finance', 'Healthcare & Bio', 'Retail & Logistics'], skills: ['data science', 'statistics', 'SQL', 'experimentation', 'machine learning', 'forecasting'] },
  { t: 'Process Engineer', area: 'Process Engineering', majors: [CHBE, MSE], inds: ['Energy & Climate', 'Healthcare & Bio'], skills: ['process engineering', 'manufacturing', 'scale-up', 'chemical engineering', 'quality'] },
  { t: 'Battery Engineer', area: 'Energy Storage', majors: [CHBE, MSE, MECH], inds: ['Energy & Climate'], skills: ['batteries', 'energy storage', 'climate tech', 'electric vehicles', 'materials', 'electrochemistry'] },
  { t: 'Power Systems Engineer', area: 'Grid Engineering', majors: [EE], inds: ['Energy & Climate'], skills: ['power systems', 'renewable energy', 'grid', 'solar', 'climate tech', 'energy markets'] },
  { t: 'Biomedical Engineer', area: 'R&D', majors: [BME, MECH], inds: ['Healthcare & Bio'], skills: ['medical devices', 'FDA', 'biomechanics', 'surgical robotics', 'prototyping', 'clinical trials'] },
  { t: 'Computational Biologist', area: 'Computational Biology', majors: [BME, CS], inds: ['Healthcare & Bio', 'Startup'], skills: ['genomics', 'drug discovery', 'biotech', 'bioinformatics', 'machine learning'] },
  { t: 'Health Data Scientist', area: 'Public Health Analytics', majors: [BME, MATH, IE], inds: ['Healthcare & Bio'], skills: ['epidemiology', 'public health', 'statistics', 'health data', 'data science'] },
  { t: 'Structural Engineer', area: 'Structures', majors: [CE], inds: ['Infrastructure'], skills: ['structural engineering', 'transportation', 'infrastructure', 'construction', 'urban planning'] },
  { t: 'Product Designer', area: 'Design', majors: [ID, CS], inds: ['Tech', 'Startup'], skills: ['UX design', 'product design', 'prototyping', 'design systems', 'user research'] },
  { t: 'Investor', area: 'Investing', majors: [BA, CS, IE, EE], inds: ['Venture Capital'], skills: ['venture capital', 'funding', 'startups', 'deep tech', 'seed investing', 'fundraising'] },
  { t: 'Co-founder & CEO', area: '', majors: [...A], inds: ['Startup'], skills: ['fundraising', 'product strategy', 'sales', 'recruiting', 'early-stage startups'], fixed: true },
  { t: 'Co-founder & CTO', area: '', majors: [CS, CMPE, EE, MECH, AE, BME], inds: ['Startup'], skills: ['system architecture', 'engineering leadership', 'recruiting', 'early-stage startups'], fixed: true },
]

export const MAJOR_ABBR: Record<string, string> = {
  [CS]: 'CS',
  [EE]: 'EE',
  [MECH]: 'ME',
  [AE]: 'AE',
  [IE]: 'ISyE',
  [BME]: 'BME',
  [CMPE]: 'CmpE',
  [CHBE]: 'ChBE',
  [CE]: 'CE',
  [BA]: 'Business',
  [ID]: 'ID',
  [MSE]: 'MSE',
  [PHYS]: 'Physics',
  [MATH]: 'Math',
}

export const CLUBS = [
  'RoboJackets',
  'HackGT',
  'GT Solar Racing',
  'Yellow Jacket Space Program',
  'GT Motorsports',
  'Startup Exchange',
  'CREATE-X',
  'Data Science at GT',
  'GT Investments Committee',
  'Consult Your Community',
  'Women in Computing',
  'Society of Women Engineers',
  'NSBE',
  'SHPE',
  'Marching Band',
  'Ramblin’ Reck Club',
  'Technique',
  'DramaTech',
  'Glee Club',
  'Engineers Without Borders',
  'WREK Radio',
  'Student Government',
  'GT Lorraine',
  'Co-op Program',
]

const CLUB_BIAS: Record<string, string[]> = {
  Robotics: ['RoboJackets', 'GT Motorsports'],
  Aerospace: ['Yellow Jacket Space Program', 'GT Solar Racing'],
  Startup: ['CREATE-X', 'Startup Exchange', 'HackGT'],
  'Venture Capital': ['Startup Exchange', 'GT Investments Committee', 'CREATE-X'],
  Finance: ['GT Investments Committee'],
  Consulting: ['Consult Your Community', 'Student Government'],
  Tech: ['HackGT', 'Data Science at GT', 'Women in Computing'],
  'Energy & Climate': ['GT Solar Racing', 'Engineers Without Borders'],
}

export const LABS = [
  'Institute for Robotics and Intelligent Machines',
  'Aerospace Systems Design Lab',
  'Machine Learning Center',
  'Contextual Computing Group',
  'Manufacturing Institute',
  'Strategic Energy Institute',
  'Petit Institute for Bioengineering',
  'Space Systems Design Lab',
  'Sonification Lab',
  'Supply Chain and Logistics Institute',
]

const LAB_BIAS: Record<string, string[]> = {
  Robotics: ['Institute for Robotics and Intelligent Machines'],
  Aerospace: ['Aerospace Systems Design Lab', 'Space Systems Design Lab'],
  Tech: ['Machine Learning Center', 'Contextual Computing Group'],
  'Energy & Climate': ['Strategic Energy Institute'],
  'Healthcare & Bio': ['Petit Institute for Bioengineering'],
  'Retail & Logistics': ['Supply Chain and Logistics Institute'],
}

const DORMS = ['Glenn', 'Towers', 'Smith', 'Harrison', 'Brown', 'Field', 'Woodruff', 'North Avenue', 'Hefner', 'Armstrong']

const FIRST = 'Aaliyah Aarav Abigail Adaeze Aditya Aiden Alejandro Amara Amir Ana Andre Anika Anthony Arjun Ava Ben Bianca Caleb Camila Carlos Chloe Chidi Claire Daniel Darius David Deja Diego Elena Eli Emma Ethan Fatima Gabriel Grace Hana Hannah Hassan Imani Isaac Isabella Jada Jae-won Jamal James Jasmine Javier Jin Jordan Julia Kai Karthik Kayla Kenji Kevin Lauren Layla Leo Liam Lin Lucas Maya Mei Michael Min-jun Mohamed Naomi Nia Nikhil Noah Nora Olivia Omar Priya Rachel Rahul Rohan Ryan Sana Sarah Sofia Tariq Tyler Victoria Wei William Xavier Yuki Zara Zoe'.split(' ')
const LAST = 'Adams Agarwal Ahmed Ali Anderson Bailey Banerjee Brooks Brown Campbell Carter Chen Cho Clark Cohen Cruz Davis Diaz Edwards Evans Flores Foster Garcia Gupta Hall Harris Hernandez Huang Iyer Jackson Johnson Jones Kapoor Khan Kim Kumar Lee Lewis Li Liu Lopez Martin Martinez Mehta Miller Mitchell Morgan Nakamura Nguyen Okafor Okonkwo Park Patel Perez Pham Ramirez Rao Reddy Rivera Robinson Rodriguez Sato Scott Shah Sharma Singh Smith Suzuki Tanaka Taylor Thomas Thompson Tran Turner Walker Wang Washington Williams Wilson Wright Wu Yang Young Zhang Zhou'.split(' ')

function mulberry32(a: number) {
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rnd = mulberry32(1885)
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]
function weighted<T>(arr: readonly T[], w: (t: T) => number): T {
  const total = arr.reduce((s, x) => s + w(x), 0)
  let r = rnd() * total
  for (const x of arr) {
    r -= w(x)
    if (r <= 0) return x
  }
  return arr[arr.length - 1]
}
function sample<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr]
  const out: T[] = []
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rnd() * copy.length), 1)[0])
  return out
}

export const THIS_YEAR = 2026

function titleFor(role: RoleDef, yrs: number) {
  if (role.fixed) return role.t
  if (yrs < 3) return role.t
  if (yrs < 8) return `Senior ${role.t}`
  if (yrs < 15) return `Principal ${role.t}`
  return rnd() < 0.35 && yrs > 22 ? `VP of ${role.area}` : `Director of ${role.area}`
}

const FOUNDERS = new Set<string>()

function makePerson(id: number): Person {
  const major = weighted(MAJORS, (m) => m.w).name
  const role = weighted(
    ROLES.filter((r) => r.majors.includes(major)),
    (r) => (r.fixed ? 0.35 : 1),
  )
  const industry = pick(role.inds)
  const company = pick(COMPANIES.filter((c) => c.industry === industry))
  const city = weighted(company.cities, (c) => Math.sqrt(CITY_BY_NAME.get(c)!.w))
  const year = THIS_YEAR - Math.floor(41 * Math.pow(rnd(), 1.9))
  const yrs = THIS_YEAR - year
  const degree = rnd() < 0.72 ? 'BS' : rnd() < 0.75 ? 'MS' : 'PhD'

  const clubs = new Set<string>()
  const bias = CLUB_BIAS[industry]
  if (bias && rnd() < 0.55) clubs.add(pick(bias))
  const extra = rnd() < 0.5 ? 1 : rnd() < 0.5 ? 2 : 0
  for (const c of sample(CLUBS, extra)) clubs.add(c)

  let lab: string | undefined
  if (rnd() < (degree === 'BS' ? 0.18 : 0.6)) {
    const lb = LAB_BIAS[industry]
    lab = lb && rnd() < 0.7 ? pick(lb) : pick(LABS)
  }

  const prev: string[] = []
  const nPrev = yrs < 2 ? 0 : yrs < 6 ? (rnd() < 0.6 ? 1 : 0) : rnd() < 0.5 ? 1 : 2
  while (prev.length < nPrev) {
    const pool = COMPANIES.filter((c) => c.industry !== 'Startup' && c.name !== company.name && !prev.includes(c.name))
    const same = pool.filter((c) => c.industry === industry)
    prev.push((rnd() < 0.6 && same.length ? pick(same) : pick(pool)).name)
  }

  const skills = [...sample(role.skills, 3 + Math.floor(rnd() * 2)), ...(company.focus ?? [])]
  const openTo: OpenTo[] = []
  if (rnd() < 0.7) openTo.push('coffee')
  if (rnd() < 0.4) openTo.push('referrals')
  if (rnd() < 0.35 + Math.min(yrs, 15) * 0.02) openTo.push('mentoring')
  if (rnd() < (role.fixed ? 0.7 : 0.18)) openTo.push('hiring')

  const first = pick(FIRST)
  // One CEO and one CTO per startup, and nobody founds a company the year they graduate.
  const seat = `${company.name}|${role.t}`
  const founder = role.fixed && yrs >= 3 && !FOUNDERS.has(seat)
  if (founder) FOUNDERS.add(seat)
  const title = role.fixed && !founder ? (yrs < 3 ? 'Founding Engineer' : 'Head of Engineering') : titleFor(role, yrs)
  const bio =
    `${title} at ${company.name} in ${city}, working on ${skills[0]} and ${skills[1]}.` +
    (prev.length ? ` Previously at ${prev.join(' and ')}.` : '') +
    ` ${degree} ${major}, class of ${year}.`

  return {
    id,
    name: `${first} ${pick(LAST)}`,
    year,
    major,
    degree,
    clubs: [...clubs],
    lab,
    dorm: pick(DORMS),
    company: company.name,
    role: title,
    industry,
    city,
    prev,
    skills,
    openTo,
    chatsLeft: openTo.length ? Math.floor(rnd() * 4) : 0,
    bio,
    hue: Math.floor(rnd() * 360),
  }
}

// The signed-in demo student.
export const ME: Person = {
  id: 0,
  name: 'Sam Rivera',
  year: 2027,
  major: CS,
  degree: 'BS',
  clubs: ['RoboJackets', 'HackGT'],
  lab: 'Institute for Robotics and Intelligent Machines',
  dorm: 'Glenn',
  company: 'Georgia Tech',
  role: 'Student',
  industry: 'Student',
  city: 'Atlanta',
  prev: ['Delta Air Lines'],
  skills: ['robotics', 'machine learning', 'Python'],
  openTo: [],
  chatsLeft: 0,
  bio: 'Third-year CS student interested in robotics and machine learning.',
  hue: 45,
}

export const PEOPLE: Person[] = [ME, ...Array.from({ length: 1600 }, (_, i) => makePerson(i + 1))]
export const ALUMNI = PEOPLE.slice(1)
