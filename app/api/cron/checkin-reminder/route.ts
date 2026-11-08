import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { sendCheckinReminders } from "@/lib/checkin-reminder.server"
import { logError } from "@/lib/observability/logger"

export const dynamic = "force-dynamic"

/**
 * Called once a day by Vercel Cron (vercel.json), which sends
 * `Authorization: Bearer $CRON_SECRET` when that variable is set on the
 * project. Without it nothing can call this, Vercel included, so the reminder
 * stays off rather than becoming a public "push to everyone" button.
 */
function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const encoder = new TextEncoder()
  const given = encoder.encode(request.headers.get("authorization") ?? "")
  const expected = encoder.encode(`Bearer ${secret}`)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export async function GET(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    return NextResponse.json(await sendCheckinReminders())
  } catch (error) {
    logError("checkin_reminder_failed", error)
    return NextResponse.json({ error: "Reminder run failed" }, { status: 500 })
  }
}
