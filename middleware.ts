import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/app(.*)',
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/account(.*)',
  '/api/account(.*)',
  '/api/private(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // "ingest" is excluded from auth middleware: it is the same-origin reverse
    // proxy for PostHog (see rewrites in next.config.mjs). Running Clerk on every
    // analytics request is wasted middleware invocations, and it also stopped
    // events reaching PostHog (NIK-111) — do not put "ingest" back in the matcher.
    "/((?!_next/static|_next/image|favicon.ico|ingest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
