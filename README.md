# Wera-Frontend

The dashboard for [wera](../wera) — a private job-tracker pipeline
(Go + Postgres + Coral LLM). Dark, fast triage of scored infrastructure jobs:
today's best fits, a filterable jobs table, an application tracker kanban,
and a System page with pipeline health and LLM cost.

It never applies anywhere — postings always open at the source. Types come
from real API fixtures captured from `wera serve` (`src/api/__fixtures__`).

## Stack

Vite · React 18 · TypeScript (strict) · Tailwind CSS v4 (`@theme` tokens in
CSS, no config file) · react-router-dom v6 · @tanstack/react-query v5 ·
recharts · lucide-react · Geist / Geist Mono.

## Develop

```sh
# backend (repo root of ../wera):
go run ./cmd/wera serve        # :8080

# frontend:
npm install
npm run dev                    # :5173, /api proxied to :8080
```

## Build

```sh
npm run build                  # tsc (strict, zero errors) + vite build -> dist/
```

### Production-mode test on your PC

```sh
npm run build
npx vite preview --port 3000   # serves the real dist/ bundle; /api proxied to :8080
```

With `wera serve` running on :8080 this exercises the exact shipped bundle
(minified, hashed assets, SPA fallback) — everything except the nginx
header/gzip layer and the container build.


## Docker

Built by the backend repo's compose file as the `wera-web` service
(build context `../Wera-Frontend`), served by nginx with the SPA fallback
and `/api` proxied to `wera-api:8080`:

```sh
cd ../wera
docker compose up -d --build wera-web   # http://localhost:3000
```

## Layout

```
src/
├── api/          client.ts, types.ts (from fixtures), hooks.ts (react-query)
├── components/   Badge, ScoreRing, JobCard/Row/Drawer, FilterBar, Charts, …
├── pages/        Today, Jobs, Tracker, System, Excluded
├── layout/       AppShell (sidebar, top bar, Run now, health dot)
└── lib/          format.ts, toast.tsx
```

Design tokens live in `src/index.css` (`@theme`). Keyboard shortcuts on the
Jobs page: `j`/`k` to move, `Enter` to open the drawer, `o` to open the posting.
