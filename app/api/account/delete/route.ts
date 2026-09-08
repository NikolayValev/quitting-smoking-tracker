import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { deleteUserByClerkId } from "@/lib/auth/deleteUserByClerkId"
import { logError } from "@/lib/observability/logger"

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
  try {
    await deleteUserByClerkId(userId)
  } catch (err) {
    // The Clerk account is already gone, so reporting failure here would tell
    // the user their deletion did not happen when most of it did. Log it and
    // let the webhook retry the remainder.
    logError("account_delete_local_cleanup_failed", err, { clerkUserId: userId })
  }

  return NextResponse.json({ success: true })
}
