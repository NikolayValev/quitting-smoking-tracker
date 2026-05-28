import { NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { sql } from "drizzle-orm"

export async function GET() {
  try {
    await db.select({ one: sql`1` }).from(users).limit(1)
    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json(
      { status: "degraded", timestamp: new Date().toISOString(), error: "Database unreachable" },
      { status: 503 },
    )
  }
}
