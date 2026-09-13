import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { deleteUserByClerkId } from "@/lib/auth/deleteUserByClerkId"
import { logError } from "@/lib/observability/logger"

/**
 * Deletes the caller's account and hands back a receipt (GDPR Art. 17).
 *
 * The receipt is given to the user and deliberately not stored. Keeping a row
 * about someone who just asked to be erased would undercut the erasure itself,
 * and a record only they hold is enough to evidence it. `smokeLogsErased` is
 * counted inside the deleting transaction, so they can check it against the
 * export they took beforehand; the operational trail stays in the logs.
 *
 * It carries no user id: the receipt attests that an erasure happened, and
 * restating the identity that was erased would work against the point of it.
 */
export async function POST() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const client = await clerkClient()
    await client.users.deleteUser(userId)
  } catch (err) {
    logError("account_delete_failed", err, { clerkUserId: userId })
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }

  // Clerk is deleted first: if this request dies halfway, the account is gone
  // and the local rows are the recoverable half, rather than the user losing
  // their logs while still being able to sign in.
  //
  // Deleting locally here rather than relying only on the user.deleted webhook
  // means the erasure completes within this request, so it holds even if the
  // webhook is misconfigured or Clerk's delivery is delayed. The webhook stays
  // the backstop for deletions that never pass through this route, and for the
  // failure below. deleteUserByClerkId is idempotent, so both running is fine.
  let smokeLogsErased: number | null = null
  let complete = false

  try {
    const result = await deleteUserByClerkId(userId)
    smokeLogsErased = result.smokeLogsErased
    complete = true
  } catch (err) {
    // The Clerk account is already gone, so reporting failure here would tell
    // the user their deletion did not happen when most of it did. Log it and
    // let the webhook retry the remainder. The receipt below says so rather than
    // claiming an erasure that has not finished.
    logError("account_delete_local_cleanup_failed", err, { clerkUserId: userId })
  }

  return NextResponse.json({
    success: true,
    receipt: {
      // Web Crypto rather than node:crypto so the route is not pinned to the
      // Node runtime.
      id: crypto.randomUUID(),
      deletedAt: new Date().toISOString(),
      accountErased: true,
      smokeLogsErased,
      complete,
    },
  })
}
