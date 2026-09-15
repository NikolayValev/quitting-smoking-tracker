# CLAUDE.md — quitting-smoking-tracker (SmokeFree)

Next.js quit-tracking app. Clerk auth, Neon Postgres via Drizzle, Radix UI,
Vitest + Playwright. Package manager is **pnpm** (`pnpm@9.15.0`, `pnpm-lock.yaml`) — do not use npm.

## Commands

| Task | Command | Note |
|---|---|---|
| Dev | `pnpm dev` | |
| Test | `pnpm exec vitest run` | **Not `pnpm test`** — see below |
| Typecheck | `pnpm exec tsc --noEmit` | no `typecheck` script; CI runs it directly |
| Lint | `pnpm lint` | |
| Build | `pnpm build` | |
| Screens | `pnpm screens` | Playwright visual capture — see the `screen-review` skill |
| Migrations | `pnpm db:generate` then `pnpm db:migrate` | `db:migrate` reads `--env-file=.env` |
| Buddy round-trip | `pnpm verify:buddies` | Hits the real database; creates throwaway users and deletes them |

**`pnpm test` is bare `vitest`, which starts watch mode and hangs any unattended
run.** Use `pnpm exec vitest run`. CI works around this with `pnpm test -- --run`.

CI (`.github/workflows/ci.yml`) runs, in order: install `--frozen-lockfile`,
`pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test -- --run`, `pnpm build`.

## Conventions

- Tickets, branches and commits follow the **`linear-ticket-flow`** skill (team `NIK`).
- Any visual change goes through the **`screen-review`** skill. The signed-in
  screens are behind both Clerk and the database; `/dev/<screen>` and
  `pnpm screens` are the only way to look at them.
- Analytics follows the **`posthog-analytics`** skill. This app is the only one
  handling health data, so its privacy posture is enforced in SDK config
  (`lib/analytics/posthog.ts`) rather than at call sites — no autocapture, no
  session recording, bucketed counts, identify by Clerk id only.
- `ingest` must stay **out** of the `middleware.ts` matcher (NIK-111).
- React Compiler rules are enforced (`react-hooks/purity`) — NIK-108 fixed a
  batch of set-state-in-effect violations; don't reintroduce them.

## Current state (2026-09-15)

**Buddies** shipped in `75688ce`: `app/buddies/`, `app/join/`, `lib/buddies.ts`,
`lib/milestones.ts`, migration `0003`. A buddy sees only a streak and milestone
count — `getSharedSummary` names its output fields rather than spreading a log
row, and a test asserts the exact key set. Do not widen it casually.

**Backfill and edit** shipped in `c799f9f`: migration `0004` adds `smoke_logs.log_date`
and makes a day unique per person. `createLog` upserts by day, so logging a day
twice replaces it.

**Onboarding and money** shipped in `addbbed` (NIK-121): migration `0005` adds the
baseline, pack price and currency. Savings use them and format with `Intl`.
`lib/user-settings.ts` must stay free of `@/db` — the settings form is a client
component and imports from it; the query lives in `lib/user-settings.server.ts`
behind `server-only`.

**Migrations 0003–0005 are applied to Neon** (verified 2026-09-15: `buddy_links`,
`log_date`, the settings columns and all three indexes present, 4 existing rows
intact). The buddy cycle passes 18/18 against the live database via
`pnpm verify:buddies`.
