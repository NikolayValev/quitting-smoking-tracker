import { NextResponse, type NextRequest } from 'next/server';
import { verifyWebhook } from '@clerk/nextjs/webhooks';
import { deleteUserByClerkId } from '@/lib/auth/deleteUserByClerkId';
import { logError, logWarn } from '@/lib/observability/logger';

/**
 * Clerk webhook receiver.
 *
 * The Clerk instance is shared by every app on nikolayvalev.com, so the sign-in
 * is deleted outside this app: from Clerk's own account screen in any of them,
 * or by an admin in the Clerk dashboard. (`POST /api/account/delete` erases only
 * this app's data and leaves the sign-in alone.) This endpoint is where those
 * deletions reach us, so the local data is erased whichever path removed the
 * account. Each app sharing the instance needs its own endpoint registered.
 *
 * Requires CLERK_WEBHOOK_SIGNING_SECRET; `verifyWebhook` reads it directly.
 * The route is intentionally outside `isProtectedRoute` in middleware.ts —
 * Clerk signs these requests rather than sending a session, so signature
 * verification is the whole of the auth story here.
 */
export async function POST(request: NextRequest) {
  let event;
  try {
    event = await verifyWebhook(request);
  } catch (err) {
    // Unverified payloads are untrusted; log without echoing the body back.
    logError('clerk_webhook_verification_failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'user.deleted') {
    return NextResponse.json({ received: true });
  }

  const clerkUserId = event.data.id;
  if (!clerkUserId) {
    // Clerk always sends an id here; if one is missing the payload is malformed
    // and retrying will not help, so fail rather than guess whose data to erase.
    logWarn('clerk_webhook_user_deleted_missing_id');
    return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
  }

  try {
    const { deleted } = await deleteUserByClerkId(clerkUserId);
    return NextResponse.json({ received: true, deleted });
  } catch (err) {
    // 500 makes Clerk retry with backoff. deleteUserByClerkId is transactional
    // and a no-op once the rows are gone, so a retry is safe.
    logError('clerk_webhook_user_deleted_failed', err, { clerkUserId });
    return NextResponse.json({ error: 'Failed to delete user data' }, { status: 500 });
  }
}
