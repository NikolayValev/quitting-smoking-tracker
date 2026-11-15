# Production Readiness

> **2026-11-15: portfolio, on production Clerk.** Still not commercial, but the
> dev instance goes: one production Clerk instance shared by every app on
> nikolayvalev.com replaces it. See "Production Clerk" below.
>
> **2026-10-27: heading for real users.** The portfolio framing below is being
> retired. Sponsors put a call for help and slip days in front of another
> person, which is not something to run on a development instance capped at
> ~100 users. "If it ever does take real users" is now the plan, and NIK-117 is
> the gate for inviting anyone outside friends and testers. The "deliberate"
> list stays as a record of why each choice was made, until each is reversed.

This app is a **portfolio piece**, deliberately. It exists so friends, recruiters
and people online can look at the work, not to take paying customers. Several
things below would be wrong for a commercial product and are right for this one;
they are recorded here so nobody has to rediscover the reasoning.

The decision that shapes the rest: **staying on the Clerk development instance**
(confirmed 2026-09-15).

## Deliberate, with their costs stated

- **Clerk development instance** — NIK-117. Caps at roughly 100 users, uses
  Clerk's shared Google OAuth rather than this project's own, and prints a small
  orange **"Development mode"** line on the sign-in card. That line is visible to
  anyone who signs up and cannot be styled away; it is the honest price of not
  standing up a production instance. Anyone only *looking* never sees it, which
  is why the landing page leads with the sample journey rather than sign-up.
- **No `CLERK_WEBHOOK_SIGNING_SECRET`** — NIK-116. Deleting an account *from
  inside the app* still erases everything, in-request, including buddy links;
  that path does not use the webhook. What does not propagate is a deletion
  started elsewhere — removing a user from the Clerk dashboard leaves their rows
  and shares behind. At this scale that means occasional orphaned rows after
  clearing out test accounts, not a privacy failure.
- **Clerk's shared Google credentials** — NIK-118. The consent screen is
  Clerk-branded rather than SmokeFree-branded. The project's own OAuth client is
  unused and Google will delete it for inactivity, which is the desired outcome.
- **The rate limiter fails open.** If the database is unreachable, writes are
  allowed rather than users being locked out of logging. See `lib/rate-limit.ts`.
- **The deletion receipt is not stored.** Persisting a record about someone who
  asked to be erased would work against the erasure. The user holds the only
  copy. See `app/api/account/delete/route.ts`.
- **No stored quit date.** The streak comes from the current unbroken run of
  smoke-free check-ins; a second stored date would be a rival source of truth.
- **Fonts are self-hosted** via the `geist` package so builds need no network
  access to Google. Do not reintroduce `next/font/google`.

## Production Clerk: one instance shared across nikolayvalev.com

**Decided 2026-11-15.** One Clerk application with a production instance on the
root domain `nikolayvalev.com` (Frontend API at `clerk.nikolayvalev.com`) serves
every app on a subdomain, so one sign-in works across them. The main reason is
to get rid of the "Development mode" line on the sign-in card everywhere. No
users were real at the switch, so the dev-instance rows were not carried over.

What sharing changes in this app:

- **Deleting your data no longer deletes the sign-in.** `POST /api/account/delete`
  erases only SmokeFree's rows. Deleting the Clerk user would sign the person
  out of every other app and leave those apps' rows orphaned. The sign-in is
  removed from Clerk's own Manage account screen, and the `user.deleted` webhook
  then erases this app's rows. A failed erasure now returns 500 rather than a
  partial receipt, since no webhook would finish it.
- **The sign-in card is relabelled in code.** Clerk's default title names the
  shared application, so `ClerkThemeProvider` overrides the strings that
  interpolate it.
- **Instance-wide settings are shared.** Sign-in methods, sign-up restrictions
  and the "users can delete their account" toggle apply to every app. An app
  that should not be fully public has to gate that in its own repo (for example
  an env flag that turns off `/sign-up`), not in Clerk.
- **Each app registers its own webhook endpoint** in the shared instance.

Cutover, in order (dashboard and DNS work, except where noted):

1. **NIK-117**: rename the existing Clerk application to something neutral, then
   create its production instance on `nikolayvalev.com`. Add the CNAMEs it lists
   to Vercel DNS (the zone lives there), then deploy certificates.
2. **NIK-118**: own Google OAuth client, needed *at the same time* if Google
   sign-in is on, because production instances cannot use Clerk's shared
   credentials. Redirect URI `https://clerk.nikolayvalev.com/v1/oauth_callback`.
3. **NIK-116**: webhook endpoint `https://smoking.nikolayvalev.com/api/webhooks/clerk`
   for `user.deleted`; its `whsec_` goes in `CLERK_WEBHOOK_SIGNING_SECRET`.
4. Production-only `pk_live_` / `sk_live_` / `whsec_` in Vercel, then redeploy.
   Preview and Development keep the dev keys: live keys only work on the domain.
5. Remove the two dev-instance rows with `deleteUserByClerkId`; nothing can sign
   in as them any more.

## Still worth doing regardless

- **Decommission the orphaned Supabase project** `ygcblgluayqupelmmrgs` — NIK-107.
  May still hold pre-migration user data and may still be billing. Back up first.
  Needs the Supabase dashboard.
- **Remove the dangling `auth.nikolayvalev.com` DNS record.** It points at Vercel
  with nothing behind it.
- **Confirm Neon backup / PITR retention.** Know the restore window.
- **React / Clerk peer skew** — NIK-114 bumped this; re-check after Clerk upgrades.
- **Exercise the GDPR paths by hand.** The export and the deletion receipt are
  covered by unit tests and by `verify:buddies` at the database level, but nobody
  has yet signed in, downloaded the JSON, deleted the account and read the
  receipt. That is the one thing tests cannot stand in for.

## Done

- **Migrations 0003–0005 applied to Neon** (2026-09-15). `buddy_links`,
  `smoke_logs.log_date`, the settings columns and all three indexes are present;
  the four pre-existing check-ins survived with `log_date` backfilled.
- **The buddy cycle is verified against the live database** — `pnpm verify:buddies`
  runs invite, accept, read, revoke and the uniqueness constraints against real
  Postgres, 18 checks, cleaning up after itself.
- **Server-side error tracking** — NIK-119. `logError` falls back to the shared
  `NEXT_PUBLIC_POSTHOG_*` pair, which is valid because a project key is
  capture-only.
