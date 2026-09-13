# Production Readiness

This app currently runs as a **portfolio demo**, and a few things are configured
accordingly. Nothing here is broken for demo use — this is the honest gap between
where it is and what taking real users would require.

The live checklist is [NIK-120][nik120]; this file is the checked-in summary.
Where the two disagree, Linear wins.

## Blockers

Do not take real users without these.

- **Clerk production instance.** Production serves a `pk_test_` development key
  (`sacred-airedale-38.clerk.accounts.dev`). Development instances are user-capped,
  use Clerk's shared Google OAuth credentials rather than this project's own, and
  handle sessions more loosely than production ones. Needs a `pk_live_` instance on
  a custom Frontend API domain. — NIK-117
- **Clerk webhook signing secret.** `CLERK_WEBHOOK_SIGNING_SECRET` is unset, so the
  `user.deleted` backstop in `app/api/webhooks/clerk/route.ts` rejects every
  delivery. Deleting through the app UI still erases everything — that route does
  the work in-request — but deletions started anywhere else do not propagate. — NIK-116
- **Server-side error tracking.** `POSTHOG_API_KEY` is unset, so `logError` falls
  back to `console.error` and server errors never leave Vercel's function logs.
  Client-side analytics are unaffected and do work. — NIK-119
- **Exercise the GDPR paths against real data.** The export and deletion receipt
  have unit coverage but have never run against a real database. Log some entries,
  download the export, delete the account, and confirm the receipt's count matches
  and the rows are gone.

## Should do

- **Own Google OAuth credentials** — only if you want your own consent screen
  instead of Clerk's. Requires the production instance first. — NIK-118
- **Decommission the orphaned Supabase project** `ygcblgluayqupelmmrgs`. May still
  hold pre-migration user data and may still be billing. Back up first. — NIK-107
- **Remove the dangling `auth.nikolayvalev.com` DNS record.** It points at Vercel
  with no deployment behind it.
- **Confirm Neon backup / PITR retention.** Know the restore window before there is
  data worth restoring.
- **React / Clerk peer skew.** `react@19.2.0` sits just under Clerk's `~19.2.3`. — NIK-114

## Deliberate choices, not oversights

- **The rate limiter fails open.** If the database is unreachable, writes are allowed
  rather than users being locked out of logging. Right for a demo; worth re-deciding
  for production. See `lib/rate-limit.ts`.
- **The deletion receipt is not stored.** Persisting a record about someone who asked
  to be erased would work against the erasure. The user holds the only copy. See
  `app/api/account/delete/route.ts`.
- **Fonts are self-hosted** via the `geist` package so builds need no network access
  to Google. Do not reintroduce `next/font/google`.

[nik120]: https://linear.app/nikolayvalev/issue/NIK-120/production-readiness-checklist-quitting-smoking-tracker
