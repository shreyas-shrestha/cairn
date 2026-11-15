# Cairn

A Georgia Tech alumni network built around one search bar. Ask in plain language, see where matching alumni are on the globe, see how you are connected to each one, and get a drafted intro. Independent student project, not affiliated with or endorsed by Georgia Tech.

All 1,600 profiles are synthetic and generated in the browser. "Send" is a demo button. The only thing that leaves your machine is the search question, and only when GPT search is turned on.

## Run it

```bash
npm install
npm run dev
```

## GPT-powered search

```bash
cp .env.example .env.local
```

Put an OpenAI API key in `.env.local` and restart the dev server. Each question is then sent to an OpenAI model (`gpt-6-luna` by default), which returns a structured search plan that the browser runs against the local index. Results from the built-in parser show instantly and are replaced when the model answers. Without a key, or if the request fails, search keeps using the built-in parser.

The endpoint lives in the Vite dev and preview servers, so a production deployment needs it moved to a real backend.

## How it works

| File | What it does |
|---|---|
| `src/data.ts` | Seeded generator for the synthetic alumni, companies, cities, clubs and labs |
| `src/search.ts` | Plain-language search: recognises cities, companies, clubs, labs, majors, class years and availability as filters, then ranks the remaining topic words with BM25 and synonym expansion |
| `server/gpt.ts` | Server middleware that asks the OpenAI Responses API for a search plan, constrained by a strict JSON schema to cities, companies, clubs, labs and majors that exist |
| `src/graph.ts` | Warm-path graph: breadth-first search over shared labs, clubs, employers, cohorts and dorms gives each person a degree of separation and a chain of introductions |
| `src/intro.ts` | Template-based intro drafts, direct or through a mutual connection |
| `src/GlobeView.tsx` | WebGL globe with city markers and the introduction route to an open profile |
| `src/App.tsx` | The interface |

## Not built yet

- Real profiles (résumé or LinkedIn PDF upload, or an Alumni Association data feed)
- Accounts, real messaging and the double opt-in flow on the alum's side
- Language-model intro drafts (the seam is `draftIntro()` in `intro.ts`)
