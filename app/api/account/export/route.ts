import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { exportUserData } from "@/lib/account/exportUserData"
import { consumeRateLimit } from "@/lib/rate-limit"
import { logError } from "@/lib/observability/logger"

/**
 * Tighter than the write budget: an export reads every row a user owns, where a
 * write touches one. Five an hour is far more than anyone exercising their right
 * of access needs, and low enough that the endpoint cannot be used to hammer the
 * database.
 */
const EXPORT_LIMIT = 5
const EXPORT_WINDOW_SECONDS = 60 * 60

/**
 * Serves the caller a copy of everything we hold about them (GDPR Art. 15).
 *
 * Synchronous rather than emailed: one person's logs are small enough to build
 * inside a request, so this avoids standing up a mail path — and a link in an
 * inbox is a second place their data can leak from.
 *
 * Scoped to the session's own user id, never a parameter, so there is no way to
 * ask for someone else's file.
 */
export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Metered on its own subject so a burst of exports cannot exhaust the budget
  // that logging a cigarette depends on.
  const rate = await consumeRateLimit(`export:${userId}`, {
    limit: EXPORT_LIMIT,
    windowSeconds: EXPORT_WINDOW_SECONDS,
  })

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many export requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(EXPORT_WINDOW_SECONDS) } },
    )
  }

  try {
    const user = await currentUser()

    const data = await exportUserData(userId, {
      email: user?.emailAddresses[0]?.emailAddress ?? null,
      firstName: user?.firstName ?? null,
      lastName: user?.lastName ?? null,
    })

    const filename = `quit-smoking-tracker-export-${new Date().toISOString().slice(0, 10)}.json`

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        // Personal data: keep it out of every shared cache between here and the
        // browser, and out of the bfcache on a shared machine.
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (err) {
    // The error can name the database host; the caller gets none of it.
    logError("account_export_failed", err, { clerkUserId: userId })
    return NextResponse.json({ error: "Failed to build export" }, { status: 500 })
  }
}
