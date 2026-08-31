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
    // "ingest" is excluded deliberately: it is the same-origin reverse proxy for
    // PostHog (see rewrites in next.config.mjs). Running Clerk middleware on those
    // requests breaks ingestion — the SDK loads its config and static assets fine,
    // but capture POSTs never arrive, so the app reports a $pageleave on unload
    // and nothing else.
    "/((?!_next/static|_next/image|favicon.ico|ingest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
