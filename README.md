

# Wera Frontend

The dashboard for [Wera](https://github.com/jessechumo/Wera), a self-hosted job radar that collects jobs from public job boards and scores them against your resume using Coral Bricks.

https://github.com/user-attachments/assets/525e661c-765b-4137-98b7-168d57af9690

Each user signs up, uploads a resume, and answers a few questions; the AI drafts a profile they review, and from then on every new posting is scored against it. Wera never applies on your behalf. Every posting opens at its source.

## Features

- **Accounts:** sign up and log in; the session is an HTTP-only cookie set by the API
- **Light and dark themes:** follows the system until you pick one
- **Setup:** resume upload (PDF or pasted text) that pre-fills roles, seniority, experience and locations; a location autocomplete; work authorization and industries; then an AI-drafted profile to review
- **Today:** your review queue ranked by fit score, with sponsorship and work-mode badges
- **Jobs:** filterable, searchable table with keyboard navigation (`j`/`k` to move, `Enter` to open, `o` to open the posting)
- **Job detail:** the full posting beside the fit score, reasoning, skills you have and lack, and your status and notes; arrow keys step through the list
- **Tracker:** kanban board from saved to applied, interviewing, offer, or rejected
- **Industries:** your matches in each of 23 industries, and every company Wera watches there
- **Profile:** change preferences, profile text, resume, and password; see this month's AI spend
- **System (admins):** runs, company fetch status, every user's spend, tokens, cache hit rate, and cost
- **Excluded:** every filtered job with the reason and evidence, for auditing filters

## Stack

Vite, React 18, TypeScript (strict), Tailwind CSS v4, React Router, TanStack Query, Recharts, Lucide icons, Geist fonts.

## Setup

Clone this repo next to the backend:

```
projects/
├── wera/            backend
└── wera-frontend/   this repo
```

## Develop

```sh
# in wera/
go run ./cmd/wera serve      # API on :8080

# in wera-frontend/
npm install
npm run dev                  # http://localhost:5173, /api proxied to :8080
WERA_API=http://127.0.0.1:8090 npm run dev   # proxy to another API instead
```

Use port 5173: the API refuses state-changing requests from origins it doesn't know, and the Vite dev server is the one it allows by default.

## Build

```sh
npm run build                # type-check and build to dist/
npx vite preview --port 3000 # preview the production bundle locally
```

## Docker

The backend's `docker-compose.yml` builds this repo as the `wera-web` service. Nginx serves the app and proxies `/api` to the backend.

```sh
cd ../wera
docker compose up -d --build wera-web   # http://localhost:3000
```

## Deploy on Vercel

`vercel.json` serves the built app and rewrites `/api/*` and `/healthz` to the backend, so the browser sees a single origin and the session cookie works without cross-site settings.

1. Give the backend a public HTTPS address (for example a Cloudflare Tunnel to port 8080) and put it in both `destination` URLs in `vercel.json` (they ship as `https://wera-api.example.com`).
2. Import this repo in Vercel; the framework preset is Vite.
3. On the backend set `COOKIE_SECURE=true`, `TRUST_PROXY=true`, and `PUBLIC_ORIGINS=https://<your-app>.vercel.app`, then restart it.

## Project layout

```
src/
├── api/          API client, types, and React Query hooks
├── components/   Badge, ScoreRing, JobCard, JobDrawer, FilterBar, charts
├── auth/         Login and signup page, route guards
├── profile/      Resume upload, preference fields, profile editor
├── pages/        Welcome, Today, Jobs, Industries, Tracker, Profile, System, Excluded
├── layout/       App shell with sidebar, top bar, and Run now
└── lib/          Formatting and toast helpers
```

API types are generated from real responses captured in `src/api/__fixtures__`. Design tokens live in `src/index.css`.
