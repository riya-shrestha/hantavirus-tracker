# pipeline/

Node + TypeScript pipeline for the Hantavirus Tracker.

Phase 0 (this directory's initial state) sets up:
- Prisma schema + initial migration against Neon Postgres
- A smoke test that proves the DB layer works end-to-end

Later phases add: GeoNames import, case migration from `data/cases.json`,
LLM-based extraction from news + WHO/CDC/ECDC sources, an admin review
queue, and a daily GitHub Actions cron.

## Quick start

```bash
cd pipeline
npm install
npm run smoke       # verifies connection + schema + UNIQUE constraints
npm run db:studio   # open Prisma Studio at http://localhost:5555
```

## Files

- `prisma/schema.prisma` — single source of truth for the data model
- `prisma/migrations/` — generated SQL migration history (committed)
- `src/db.ts` — singleton PrismaClient (import from here in every script)
- `src/smoke-test.ts` — Phase 0 verification script
- `.env` / `.env.local` — `DATABASE_URL` (both gitignored; the `.env` exists
  because Prisma's CLI reads that one by default)

## Scripts

| Command | What it does |
|---|---|
| `npm run smoke` | Phase 0 sanity check |
| `npm run db:migrate` | `prisma migrate dev` — generate + apply a new migration |
| `npm run db:deploy` | `prisma migrate deploy` — apply pending migrations only (use in CI) |
| `npm run db:generate` | Regenerate the Prisma Client without migrating |
| `npm run db:studio` | Web UI to browse + edit data |
| `npm run db:reset` | **DESTRUCTIVE** — wipe DB and replay all migrations (dev only) |
| `npm run typecheck` | TypeScript no-emit type check |

## Schema overview

| Table | Purpose |
|---|---|
| `Case` | Source of truth for each case. `caseSignature` UNIQUE = anti-dupe primary |
| `Article` | News articles / official notices. `canonicalUrl` UNIQUE |
| `CaseArticle` | Many-to-many join — one article can cover many cases, and vice versa |
| `ReviewQueue` | Pipeline writes proposed cases here; admin approves/rejects via /admin |
| `City` | GeoNames cities1000 bulk-loaded (Phase 1) |
| `CityAlias` | Alternate names for the same city ('Zürich' ↔ 'Zurich') |
| `CruisePosition` | Daily noon positions of the MV Hondius; at-sea cases plot here |
| `TransmissionEdge` | Forward-compat for the v1.2 transmission-chain page |

Enums: `CaseType`, `CurrentStatus`, `DeathClassification`, `LocationSpecificity`,
`CaseArticleRole`, `ReviewStatus`, `TransmissionRoute`.

## Connection

The pipeline reads `DATABASE_URL` from `.env`. The connection points at Neon's
pooled endpoint (the `-pooler` host suffix) for serverless safety.

If the password is ever leaked: rotate in the Neon dashboard, update `.env`
and `.env.local` here, and update the GitHub Actions secret + Vercel env
var (when those exist).
