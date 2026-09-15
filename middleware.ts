import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

/**
 * Pages a signed-out visitor should be sent to sign in from, rather than be
 * refused. `auth.protect()` answers these with a 404, which tells someone who
 * followed a bookmark that the page does not exist when it does — they just are
 * not signed in yet.
 */
const isProtectedPage = createRouteMatcher([
  '/app(.*)',
  '/dashboard(.*)',
  '/onboarding(.*)',
  '/account(.*)',
  '/buddies(.*)',
  // Protected on purpose: an invite code must never be enough on its own to
  // reach anything. Accepting requires an account, so a forwarded link cannot
  // quietly hand someone's streak to a stranger.
  '/join(.*)',
]);

/**
 * API routes, where a redirect would be wrong: a fetch wants a status code, not
 * an HTML sign-in page. These keep `auth.protect()`.
 */
const isProtectedApi = createRouteMatcher(['/api/account(.*)', '/api/private(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedApi(req)) {
    await auth.protect();
    return;
  }

  if (isProtectedPage(req)) {
    const { userId } = await auth();
    if (!userId) {
      // Redirecting here rather than leaning on auth.protect()'s own redirect:
      // that resolves the sign-in URL from Clerk configuration this app does not
      // set, and falls back to a 404. Carrying redirect_url means the visitor
      // lands where they were headed instead of on a generic page.
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    // "ingest" is excluded from auth middleware: it is the same-origin reverse
    // proxy for PostHog (see rewrites in next.config.mjs). Running Clerk on every
    // analytics request is wasted middleware invocations, and it also stopped
    // events reaching PostHog (NIK-111) — do not put "ingest" back in the matcher.
    "/((?!_next/static|_next/image|favicon.ico|ingest|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
