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

A **buddies** feature is in progress and uncommitted: `app/buddies/`, `app/join/`,
`components/buddies-view.tsx`, `lib/buddies.ts`, `lib/milestones.ts`, and
migration `drizzle/0003_mighty_vapor.sql`. Ask before reworking or discarding it.
