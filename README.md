

# Wera Frontend

The dashboard for [Wera](https://github.com/jessechumo/Wera), a self-hosted job radar that collects jobs from public job boards and scores them against your resume using Coral Bricks.

https://github.com/user-attachments/assets/525e661c-765b-4137-98b7-168d57af9690

It shows today's best matches, a filterable jobs table, an application tracker, and a System page with pipeline health and LLM cost. Wera never applies on your behalf. Every posting opens at its source.

## Features

- **Today:** new matches ranked by fit score, with sponsorship and work-mode badges
- **Jobs:** filterable, searchable table with keyboard navigation (`j`/`k` to move, `Enter` to open, `o` to open the posting)
- **Job detail:** fit score, reasoning, skills matched and missing, and the sponsorship quote
- **Tracker:** kanban board from saved to applied, interviewing, offer, or rejected
- **System:** runs, company fetch status, tokens, cache hit rate, and cost
- **Excluded:** every filtered job with the reason and evidence, for auditing filters

## Stack

Vite, React 18, TypeScript (strict), Tailwind CSS v4, React Router, TanStack Query, Recharts, Lucide icons, Geist fonts.

## Setup

Clone this repo next to the backend:

```
projects/
├── Wera/            backend
└── Wera-Frontend/   this repo
```

## Develop

```sh
# in Wera/
go run ./cmd/wera serve      # API on :8080

# in Wera-Frontend/
npm install
npm run dev                  # http://localhost:5173, /api proxied to :8080
```

## Build

```sh
npm run build                # type-check and build to dist/
npx vite preview --port 3000 # preview the production bundle locally
```

## Docker

The backend's `docker-compose.yml` builds this repo as the `wera-web` service. Nginx serves the app and proxies `/api` to the backend.

```sh
cd ../Wera
docker compose up -d --build wera-web   # http://localhost:3000
```

## Project layout

```
src/
├── api/          API client, types, and React Query hooks
├── components/   Badge, ScoreRing, JobCard, JobDrawer, FilterBar, charts
├── pages/        Today, Jobs, Tracker, System, Excluded
├── layout/       App shell with sidebar, top bar, and Run now
└── lib/          Formatting and toast helpers
```

API types are generated from real responses captured in `src/api/__fixtures__`. Design tokens live in `src/index.css`.
