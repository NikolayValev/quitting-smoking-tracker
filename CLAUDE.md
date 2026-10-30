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

## Current state (2026-10-27)

**Direction: real users, not a portfolio demo** (decided 2026-10-27). See the note at
the top of `PRODUCTION_READINESS.md`; NIK-117 (production Clerk) is the gate.

**Sponsors and signals** — migration `0006` adds `buddy_links.role`
(`buddy` | `sponsor`) and `buddy_signals`. A sponsor additionally sees
`lastSlipOn` and `slipDaysRecent` (`SponsorSummary`, key set asserted like the
buddy one), never cigarette counts or notes. Signals are fixed presets only, no free
text: an owner's "I'm struggling" goes to all active sponsors, and supporters send
encouragement. Delivery is in-app on `/buddies`, plus web push once VAPID keys are set (see below).
**`0006` is not yet applied to Neon**: run `pnpm db:migrate`, then `pnpm verify:buddies`,
which now covers the sponsor cycle.

## Todo (as of 2026-10-30)

Constraint: **no paid infrastructure.** Stay on free tiers (Vercel Hobby, Neon,
PostHog, Clerk free) and prefer approaches that need no vendor at all.

1. **Apply `0006` and `0007` to Neon** (`pnpm db:migrate`), then run
   `pnpm verify:buddies`. Until then, `/buddies`, account deletion and export fail
   in production. Nobody uses it yet, but do this before inviting anyone.
2. **Set the VAPID keys** in Vercel: run `pnpm exec web-push generate-vapid-keys`
   once, then set `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`. Push stays
   off until both are set. Do not rotate them, since that drops every subscribed device.
3. **Look at the screens** (`pnpm screens`): buddies, plus the landing page,
   dashboard (incl. `dashboard-slip`, `dashboard-empty`), wellness and onboarding
   after the cigarette-specific rewrite. All
   were only checked as rendered HTML; Chromium could not reach the dev server
   in the cloud container.
4. **NIK-117 → NIK-116 → NIK-118**: production Clerk instance, webhook secret, own
   Google credentials. All free; all dashboard/DNS work. NIK-117 must be done
   before inviting real users.
5. **Try push on real phones**: Android Chrome, and iPhone after Add to Home
   Screen. None of it could be exercised in the cloud container.
6. **Daily check-in reminder** over the same push (`pushToUsers` in `lib/push.ts`),
   triggered by Vercel Cron. Hobby allows daily frequency.
7. **Craving log**: urge, trigger and outcome, with trigger patterns over time.
8. **Marijuana support** (advertised as "coming soon" on the landing page and in
   onboarding). Cannabis needs its own content rather than relabelled copy: a
   different withdrawal course (irritability, poor sleep and vivid dreams that
   peak in the first week and can last a few weeks), its own triggers, and grams
   or sessions in place of cigarettes and packs. That means a substance on the
   user or the log.

**Installable app and push** (2026-10-30): `app/manifest.ts`, icons in `public/icon-*`,
`public/sw.js` (push only, deliberately no fetch handler or cache), migration
`0007` (`push_subscriptions`), `lib/push.ts` (server-only, uses `web-push` with our
own VAPID keys), `lib/push-messages.ts`, and the controls in
`components/notification-settings.tsx` on `/buddies`. An SOS and a cheer push to
the recipient's devices after the in-app signal is written, and a push failure
never fails the action. Notification text must stay lock-screen safe: no names,
nothing about smoking. A test enforces this.

**Cigarette-specific content** (2026-10-29): the app now targets cigarettes
explicitly. The withdrawal timeline is in `lib/withdrawal.ts` (shown on the
dashboard), trigger plans and tips are in `lib/data/wellness-tips.ts`, and the
support section with NRT, medication and quitlines is `components/quit-support.tsx`.
Claims are kept to NHS, smokefree.gov and Cochrane strength. Do not reintroduce
generic wellness filler or invented quote attributions.

### Earlier (2026-09-15)

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
