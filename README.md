# Agile Productions

[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![Cloudflare](https://img.shields.io/badge/Deployed%20on-Cloudflare-orange)](https://www.cloudflare.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://reactjs.org/)

Official website for **Agile Productions** — a full-stack, multi-region marketing
site with an admin CMS, built on Next.js + Cloudflare Workers and served from
Cloudflare's edge.

**Live:** [agileproductions.in](https://agileproductions.in) (IN) ·
[agileproductions.ae](https://agileproductions.ae) (AE)
**Built by:** [Agile Growth Hackers](https://agilegrowthhackers.com)

> **New to this codebase?** Read [Architecture](#architecture) and
> [Gotchas & key decisions](#gotchas--key-decisions) first — they explain the
> non-obvious parts that will otherwise cost you a day.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration & Secrets](#configuration--secrets)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Database](#database)
- [Testing](#testing)
- [Gotchas & key decisions](#gotchas--key-decisions)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

A marketing site that showcases visual content (hero slider, gallery, client
logos, services, team) with a full admin CMS behind it. Content is
**multi-region**: India (`IN`) and UAE (`AE`) are edited independently and served
per-domain, and new regions can be added from the admin without code changes.

The site is a **monorepo** with two independently deployed Cloudflare Workers:

| Package | What it is | Deployed Worker |
|---------|-----------|-----------------|
| `frontend/` | Next.js 15 (App Router) public site + admin CMS | `agile-productions-web` |
| `workers/` | Hono API on Cloudflare Workers (D1 + R2) | `agile-productions-api` |

## Architecture

```
                        Browser (agileproductions.in / .ae)
                                      │
                                      ▼
                ┌─────────────────────────────────────────┐
                │  Frontend Worker  (agile-productions-web) │
                │  Next.js 15 via @opennextjs/cloudflare    │
                │  • SSR hero (title + first slide) for LCP  │
                │  • everything else is client-rendered      │
                │  • admin app loaded ssr:false              │
                └───────────────┬───────────────────────────┘
                  service binding│ (WORKER_API)      client fetch (browser)
                                 ▼                          │
                ┌─────────────────────────────────────────┐│
                │   API Worker   (agile-productions-api)    │◄┘
                │   Hono • JWT auth • CSRF • rate limiting   │
                └───────────────┬─────────────┬─────────────┘
                                ▼             ▼
                        D1 (SQLite)        R2 (assets)
```

**Key ideas a new dev must know:**

- **Region resolution lives in the API.** Every request is tagged with a region
  by `workers/src/middleware/region.js` → `config/regions.js`, in this order:
  URL path → `Referer` path → `Origin`/`Referer`/`Host` domain → default region.
  Regions are **DB-driven** (`regions` table: `code, name, domain, route,
  is_active, is_default`).
- **Content is region-scoped with shared fallback.** Content tables carry a
  `region_code`; a row with the matching region wins, and `region_code IS NULL`
  acts as a shared fallback.
- **SSR is deliberately minimal.** Only the hero (heading + first slider image)
  is server-rendered, for a fast LCP. The rest keeps `'use client'` because
  region detection depends on the live request, and the admin loads via an
  `ssr:false` dynamic import (TipTap / DOMPurify / react-dnd aren't SSR-safe).
- **Frontend → API uses a Service Binding** (`WORKER_API` in
  `frontend/wrangler.jsonc`), not a public fetch — see
  [Gotchas](#gotchas--key-decisions).
- **Device-aware images.** The API swaps in `*_mobile` CDN URLs for mobile user
  agents (`workers/src/utils/device-detection.js`).

## Tech Stack

**Frontend** — Next.js 15 (App Router) · React 19.2 · Tailwind CSS 4.1 ·
`next/navigation` routing · React Context · react-dnd · TipTap 3.x ·
DOMPurify · `@ducanh2912/next-pwa` · Sentry (`@sentry/nextjs`) ·
deployed via `@opennextjs/cloudflare` to a Cloudflare Worker.

**Backend** — Hono 4.11 on Cloudflare Workers · D1 (SQLite) · R2 (assets) ·
JWT (`jose`) · TinyPNG (image compression) · Sentry.

**Tooling** — Playwright (frontend E2E) · Vitest (backend unit tests) ·
ESLint · GitHub Actions CI/CD.

## Project Structure

```
agile-productions/
├── frontend/                     # Next.js app (→ agile-productions-web Worker)
│   ├── app/                      # App Router: page.jsx (SSR hero), layout, providers
│   ├── src/
│   │   ├── admin/                # Admin CMS (loaded client-side, ssr:false)
│   │   ├── components/           # Public-facing components
│   │   ├── context/              # React context providers
│   │   ├── hooks/                # Custom hooks (e.g. usePageContent)
│   │   ├── services/             # api.js — single API client
│   │   ├── utils/                # web vitals, PWA helpers
│   │   └── data/                 # generated image URL maps
│   ├── e2e/                      # Playwright tests
│   ├── public/                   # static assets, _headers, manifest, icons
│   ├── next.config.mjs           # Next config (PWA + Sentry wrappers)
│   └── wrangler.jsonc            # Worker config (WORKER_API service binding)
│
├── workers/                      # Hono API (→ agile-productions-api Worker)
│   ├── src/
│   │   ├── index.js              # entry: middleware chain + route mounting
│   │   ├── routes/               # one file per resource (slider, gallery, ...)
│   │   ├── middleware/           # cors, auth, csrf, rbac, rate-limit, region, ...
│   │   ├── utils/                # analytics, activity-logger, device-detection, ...
│   │   └── config/regions.js     # region detection + DB-backed region cache
│   ├── migrations/               # numbered D1 migrations (0000_…, 0005_… upward)
│   ├── scripts/                  # one-off DB/utility scripts
│   ├── tests/                    # Vitest unit tests
│   └── wrangler.toml             # Worker config, D1/R2 bindings, ALLOWED_ORIGINS, cron
│
└── .github/workflows/            # frontend-ci, backend-ci, backup-database
```

## Getting Started

**Prerequisites:** Node.js 20+, npm 9+, a Cloudflare account, and the Wrangler
CLI (`npm i -g wrangler`). TinyPNG API key optional (image compression).

```bash
git clone https://github.com/Agile-Growth-Hackers/Agile-Productions.git
cd Agile-Productions

# Frontend
cd frontend && npm install

# Backend API
cd ../workers && npm install
```

Run the two halves in separate terminals:

```bash
# Terminal 1 — API at http://localhost:8787
cd workers && npm run dev

# Terminal 2 — site at http://localhost:3000
cd frontend && npm run dev
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8787
```

## Configuration & Secrets

### Frontend (build-time)

| Variable | Description | CI secret name |
|----------|-------------|----------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `VITE_API_URL` |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (optional) | `SENTRY_DSN` |

> The CI secret names (`VITE_API_URL`, `SENTRY_DSN`) are kept from the original
> Vite setup; the build maps them to the `NEXT_PUBLIC_*` vars.

### Backend (Wrangler secrets — `npx wrangler secret put <NAME>`)

| Secret | Required | Purpose |
|--------|----------|---------|
| `JWT_SECRET` | Yes | Signs/verifies admin JWTs |
| `TINYPNG_API_KEY` | No | Image compression on upload |
| `SENTRY_DSN` | No | Error tracking |
| `CF_API_TOKEN` | No | Powers the admin **Usage** dashboard (needs Account Analytics: Read) |

### Backend (`workers/wrangler.toml` `[vars]`)

| Variable | Value |
|----------|-------|
| `ALLOWED_ORIGINS` | Production domains only: `https://agileproductions.in,https://agileproductions.ae` |

> For local development, add localhost origins via **`workers/.dev.vars`**
> (gitignored) so they never reach production — `wrangler dev` gives `.dev.vars`
> precedence:
> ```
> ALLOWED_ORIGINS=https://agileproductions.in,https://agileproductions.ae,http://localhost:5173,http://localhost:3000
> JWT_SECRET=local-dev-secret
> ```

### GitHub Actions secrets (for deploys)

`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `VITE_API_URL`, `SENTRY_DSN`,
plus `TEST_ADMIN_*` / `TEST_SUPER_ADMIN_*` for E2E. The Cloudflare token needs
**Workers Scripts: Edit**, **Account Settings: Read**, **Zone: Read**, and
**Cache Purge** (the last two power the post-deploy cache purge).

## Deployment

Push to `main` and GitHub Actions does the rest:

- **`frontend-ci.yml`** — builds with `opennextjs-cloudflare`, deploys the
  `agile-productions-web` Worker, then purges the edge cache of every
  `agileproductions.*` zone.
- **`backend-ci.yml`** — runs Vitest, then deploys the `agile-productions-api`
  Worker.
- **`backup-database.yml`** — daily D1 export, stored as a GitHub artifact.

> Deploys are **pushed from CI** using the `CLOUDFLARE_API_TOKEN` /
> `CLOUDFLARE_ACCOUNT_ID` secrets — there is no Cloudflare-side Git integration
> to configure. You won't see this repo "linked" to the Worker in the dashboard;
> that's expected.

Manual deploy if ever needed:

```bash
cd frontend && npm run deploy   # opennextjs-cloudflare build && deploy
cd workers  && npm run deploy
```

## API Reference

All endpoints are versioned (`/api/v1/...`) with non-versioned legacy aliases
kept for compatibility. The middleware chain (in `workers/src/index.js`) is:
Sentry → HTTPS enforcement → security headers → CORS → **region detection** →
request-size limit → rate limiting → routes.

**Public** (no auth, region-filtered): `slider`, `gallery`, `gallery/mobile`,
`logos`, `page-content`, `services`, `team`, `section-images`.

**Admin** (`/api/admin/*` — JWT + CSRF + rate limit + activity logging):

| Route group | File | Notes |
|-------------|------|-------|
| `auth` | `routes/auth.js` | login/logout, issues JWT + CSRF token |
| `slider`, `gallery`, `logos` | `routes/*.js` | media CRUD + reorder |
| `storage` | `routes/storage.js` | reusable image library |
| `page-content`, `services`, `team`, `section-images` | `routes/*.js` | CMS content (region-scoped) |
| `regions` | `routes/regions.js` | manage regions |
| `profile` | `routes/profile.js` | current user profile |
| `usage` | `routes/usage.js` | Cloudflare usage dashboard |
| `users`, `activity-logs` | `routes/*.js` | **Super Admin only** |

Health: `GET /` (liveness) and `GET /health` (D1 + R2 + TinyPNG checks). For
exact endpoints/params, the route files are the source of truth — they're small
and one-per-resource.

## Database

Cloudflare **D1** (SQLite). Schema is managed by numbered migrations in
`workers/migrations/`.

```bash
cd workers
# local
npx wrangler d1 execute agile-productions-db --local  --file=migrations/<file>.sql
# production
npx wrangler d1 execute agile-productions-db --remote --file=migrations/<file>.sql
```

Core tables: `admins`, `regions`, `slider_images`, `gallery_images`,
`client_logos`, `image_storage`, `page_content`, `services`, `team_members`,
`section_images`, `activity_logs`. Content tables carry a nullable `region_code`
(matching region wins; `NULL` = shared fallback) and `*_mobile` CDN columns.

> Migrations are normally gitignored by a blanket `*.sql` rule — real numbered
> migrations are force-added (`git add -f`) so the history stays complete. Do the
> same when adding one.

A cron trigger (`wrangler.toml`) prunes `activity_logs` older than 30 days daily
at 02:00 UTC.

## Testing

```bash
# Frontend E2E (Playwright) — builds & serves the site on :3000
cd frontend && npm run test:e2e        # add :ui / :headed / :debug

# Backend unit tests (Vitest)
cd workers && npm test
```

> E2E runs the site at `localhost:3000` and calls the API at
> `NEXT_PUBLIC_API_URL`. If that points at the production API, the API's
> `ALLOWED_ORIGINS` must permit `localhost:3000` — otherwise the login flow is
> CORS-blocked. Prefer pointing E2E at a local API.

## Gotchas & key decisions

- **Worker→Worker loopback.** A plain `fetch()` from the frontend Worker to the
  API's `*.workers.dev` URL (same account subdomain) **loops back and 404s**. Use
  the `WORKER_API` **service binding** (`getCloudflareContext().env.WORKER_API`)
  in `app/page.jsx`. This silently broke SSR until found in observability logs.
- **Region only resolves per-domain once real domains are attached.** On the
  `*.workers.dev` URL there's no region domain to match, so it falls back to the
  default region (`IN`). That's expected on a test Worker; it self-corrects after
  the domains are pointed at the Worker.
- **Images must be display-sized WebP.** A batch of raw 30–36 MP camera files
  renamed `.webp` decoded to ~1 GB and made the page blank on scroll. Keep
  uploads to display dimensions (≤1600 px; ~1000 px for small tiles).
- **Next 15 injects a ~24 KB `polyfill-module`** into the client entry regardless
  of `browserslist`; it can't be removed via webpack alias. Accept it.
- **Usage dashboard reads Cloudflare Analytics for both Workers** and needs
  `CF_API_TOKEN` (Account Analytics: Read) on the API Worker — without it the
  request/error cards show 0.

## Troubleshooting

| Symptom | Likely cause / fix |
|---------|--------------------|
| SSR hero empty, 404s in API logs | Frontend calling API by URL instead of the `WORKER_API` binding |
| CORS error in local dev | Add `localhost:3000`/`:5173` to `ALLOWED_ORIGINS` in `workers/.dev.vars` |
| Wrong region's content shown | Check the `regions` table `domain` values and `is_default` |
| Usage dashboard shows 0 requests | Set `CF_API_TOKEN` secret on the API Worker |
| Sections blank/reload on fast scroll | Oversized source images — re-upload at display size |

## Contributing

Internal project. Branch from `main`, keep changes scoped, run lint + tests, and
open a PR (CI must pass; `main` is protected). Commit messages should be concise
and descriptive — `<type>: <summary>` (feat/fix/docs/refactor/test/chore) — and
must not reference tooling.

## License

Copyright © 2026 Agile Productions. All rights reserved. See [LICENSE](LICENSE).

---

**Maintained by** [Agile Growth Hackers](https://agilegrowthhackers.com) ·
**Repository:** https://github.com/Agile-Growth-Hackers/Agile-Productions
