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
    // analytics request is wasted middleware invocations. NOTE: this was first
    // made as a fix for missing pageviews and it did NOT fix them — the proxy was
    // already working. The real cause is still unknown; see NIK-111.
    "/((?!_next/static|_next/image|favicon.ico|ingest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
