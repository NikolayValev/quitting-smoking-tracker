import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { logError } from "@/lib/observability/logger"

export async function POST() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const client = await clerkClient()
    await client.users.deleteUser(userId)
    return NextResponse.json({ success: true })
  } catch (err) {
    logError("account_delete_failed", err, { clerkUserId: userId })
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
