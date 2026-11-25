import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { deleteUserByClerkId } from "@/lib/auth/deleteUserByClerkId"
import { logError } from "@/lib/observability/logger"

/**
 * Erases everything SmokeFree holds about the caller and hands back a receipt
 * (GDPR Art. 17).
 *
 * It deliberately leaves the Clerk user alone. One Clerk instance serves every
 * app on nikolayvalev.com, so the sign-in is not SmokeFree's to delete: removing
 * it here would sign the person out of the other apps for good and leave them
 * holding rows for an identity that no longer exists. Deleting the sign-in
 * itself happens in Clerk's own account screen, and the `user.deleted` webhook
 * erases this app's rows when it does.
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

  let smokeLogsErased: number
  try {
    ;({ smokeLogsErased } = await deleteUserByClerkId(userId))
  } catch (err) {
    // No webhook will finish this later, since the Clerk user still exists, so
    // say it failed. deleteUserByClerkId is one transaction: nothing was
    // half-erased, and trying again is safe.
    logError("account_delete_failed", err, { clerkUserId: userId })
    return NextResponse.json({ error: "Failed to delete your data" }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    receipt: {
      // Web Crypto rather than node:crypto so the route is not pinned to the
      // Node runtime.
      id: crypto.randomUUID(),
      deletedAt: new Date().toISOString(),
      smokeLogsErased,
    },
  })
}
