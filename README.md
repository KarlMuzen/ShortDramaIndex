# ShortDramaIndex

The calm reference library and catalog database for short vertical dramas
(mini dramas, micro dramas, duanju). Production deployment:
**https://shortdramaindex.vercel.app** (production build of `main`; pushes to
`main` trigger a fresh build, which re-generates the statically rendered
catalog pages against the live database).

## Overview

ShortDramaIndex tracks 60 titles across US and Indian short-drama platforms:

- **US:** ReelShort, DramaBox, ShortMax, GoodShort
- **India:** Kuku TV, Pocket Saga, ZO TV

Each title page shows the synopsis, cast, alternate names, tropes, and where
to watch — with the monetization model spelled out (coins per episode, free
episodes, subscription, or free with ads) instead of a bare outbound link.
Detail URLs carry a short id suffix: `/title/<slug>-<year>-<short_id>`
(the bare slug 404s by design). Other routes: `/platform/[slug]`,
`/tag/[slug]`, `/person/[slug]`, `/search`, `/guidelines`, `/privacy`,
`/terms`, `/takedown`, `/about`.

The catalog rule is strict: a field stays blank rather than guessed. A title
is only listed once its own title page on the platform has been opened and
verified — a name appearing in fuzzy search results does not count. Poster
art is either a real cover URL from the platform or a generated gradient
fallback; no placeholder images are shipped.

## Architecture

- **Next.js 15 App Router** (React 19) with **ISR, 5-minute revalidation**
  (`export const revalidate = 300` on catalog pages). Pages are statically
  rendered against the live database at build/revalidation time, so the
  public site never waits on a per-request database round-trip.
- **TypeScript** (strict; `tsc --noEmit` and `next build` both run in CI)
  and **Tailwind CSS v4** (via `@tailwindcss/postcss`).
- **Supabase PostgreSQL** as the single source of truth, with Row-Level
  Security (RLS) enabled across all 13 tables and the `pg_trgm` extension
  enabled for fuzzy text search. Search runs through the
  `search_series` RPC (`supabase/migrations/20261004000002_*`), which
  validates and clamps its inputs server-side.
- **No mock data in production.** When Supabase is not configured, data
  functions return empty results rather than fabricated catalog entries.
  Mock data exists only behind an explicit local flag, never on the live
  site.

## Data Model & Security

Canonical shape: **Series → Releases / Aliases / Tags / People**.

| Table | Notes |
| --- | --- |
| `series` | Slug (unique, `uq_series_slug`), title, `original_language`, `origin_country`, `year`, `episode_count`, `synopsis`, `poster_url`, `production_type` (`live_action`, `hybrid`, `animation`, `ai_assisted`), `verification_status` (`verified_commercial`, `editorial_approved`, `community_submitted`, `unverified`), `studio_name`, `has_human_cast`, `visibility` (`public`, `hidden`, `removed`), rating/list counters |
| `releases` | One release per series per platform, enforced by `uq_releases_series_platform` on `(series_id, platform_slug)`. Carries `url`, `direct_watch_url`, `monetization_type` (`coin_per_episode`, `subscription`, `ad_supported`, `free_with_ads`, `hybrid`), `free_episodes`, `coins_per_episode`, `estimated_unlock_cost_usd`, `episode_count` |
| `aliases` | Alternate titles, unique per `(series_id, language, lower(text))`. Community submissions enter as `pending`; only editors/moderators can mark them `verified` |
| `tags` / `series_tags` | Trope/theme taxonomy, many-to-many |
| `people` / `series_people` | Cast and crew, slug-unique (`uq_people_slug`); `role_type` is `actor`, `director`, `writer`, `producer`, or `crew` |
| `list_entries` | Per-user tracking (`watching`, `plan_to_watch`, `completed`, `dropped`, `on_hold`) plus scores; drives the popularity sort |
| `reports` | Community reports (`another_name`, `wrong_name`, `same_drama`, `not_same_drama`, `wrong_details`, `broken_link`, `other`); new reports are always `open` |
| `revisions` | Every catalog edit is recorded with a summary, diffs, and the submitting user, resolved to real profile names/roles |
| `redirects` | Old → new series id mapping for merged/renamed titles |

**Roles** (`profiles.role`): `reader`, `editor`, `moderator`.

- Readers can track titles, rate, and submit reports and pending aliases.
  They cannot mint `verified` aliases, resolve reports, or edit catalog
  records — those paths are gated in RLS *and* re-checked in server
  actions (report resolution requires a `moderator` profile role).
- Editors and moderators edit through the atomic `apply_series_edits`
  RPC (`SECURITY DEFINER`, editor/mod check inside the function, `EXECUTE`
  granted to `authenticated` only), which updates series, aliases,
  releases, tags, and the revision record in one transaction.
- Account deletion goes through the `delete_my_account` RPC before
  sign-out; the service-role key is never exposed to browser code.

**Idempotent CSV ingestion** (`scripts/import-csv.ts`, mirrored by the
REST importer): series are matched by slug (`slugify(title)-year`), and
re-running an import updates in place instead of duplicating — releases
upsert on `(series_id, platform_slug)`, aliases are skipped on their
unique key, people are found-or-created and `series_people` rows are
upserted. Omitted columns on re-import leave existing values untouched.

## Local Setup

Copy `.env.example` to `.env.local` and fill in:

| Variable | Scope |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anonymous client key |
| `NEXT_PUBLIC_SITE_URL` | Base canonical URL (e.g. `https://shortdramaindex.vercel.app`) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server / scripts only.** Elevated key used by import scripts and CI workflows. Never committed, never exposed to browser client code |

```bash
npm install
npm run dev          # local dev server
npx tsc --noEmit     # typecheck
npm run build        # production build (42 static pages)
```

### Importing catalog data

```bash
# Dry-run validation only — nothing is written
npx tsx scripts/import-csv.ts --dry-run --file scripts/batch-1.csv

# Live import as hidden entries for moderator review (default visibility)
SUPABASE_SERVICE_ROLE_KEY=your_key \
  npx tsx scripts/import-csv.ts --file scripts/batch-1.csv

# Live import as public entries
SUPABASE_SERVICE_ROLE_KEY=your_key \
  npx tsx scripts/import-csv.ts --public --file scripts/batch-1.csv
```

CSV columns: `title, original_title, original_language, origin_country,
year, episodes, synopsis, aliases, alias_source_url, platform_slug,
release_url, poster_url, tags, cast, production_type, verification_status,
studio_name, has_human_cast, monetization_type, free_episodes,
coins_per_episode, estimated_unlock_cost_usd, direct_watch_url`. Aliases use
`lang:Name` pipe-separated format (e.g. `en:True Luna`); cast uses
`Actor:Character` pipe-separated format. There is no slug column — the
importer derives it.

## Migrations

`supabase/migrations/` holds the full schema history in filename order
(`20261004000000_*` through `20261004000010_*`). This repo has no
`DATABASE_URL`, so migrations are applied by hand in the Supabase SQL
Editor, in order. The 00010 migration adds the unique indexes above,
tightens three over-permissive RLS policies (alias/report/revision
inserts), and refreshes `apply_series_edits` — run it after 00009.

## CI & Deployment

- **CI** (`.github/workflows/ci.yml`, runs on push to `main` and on pull
  requests, Node 22): `npm ci`, `npx tsc --noEmit`, `npm run build` with
  placeholder Supabase env vars, so the static build is verified on every
  change.
- **Catalog imports** (`.github/workflows/import.yml`): imports the CSV
  batches to Supabase using repository secrets. Note: the GitHub App token
  cannot create or modify workflow files, so workflow changes are applied
  through the GitHub web UI, not through pull requests.
- **Hosting:** Vercel (`shortdramaindex.vercel.app`). The `.com` domain is
  a separate site and is not attached to this deployment.

## Project Layout

```text
app/                  # App Router pages (title, platform, tag, person, search, legal)
src/
  data/               # repository.ts (reads), actions.ts (server actions), types.ts
  components/         # title, search, platform, profile, report, UI primitives
  lib/                # URL helpers, poster fallback gradients
scripts/              # import-csv.ts, batch-*.csv catalog data
supabase/migrations/  # schema + RLS + RPC history
public/posters/       # (empty by design — posters are remote covers or gradients)
```
