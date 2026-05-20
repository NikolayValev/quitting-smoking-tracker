import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("profiles").select("id").limit(1)

    if (error) {
      return NextResponse.json(
        { status: "degraded", timestamp: new Date().toISOString(), error: "Database unreachable" },
        { status: 503 },
      )
    }

    return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json(
      { status: "degraded", timestamp: new Date().toISOString(), error: "Unexpected error" },
      { status: 503 },
    )
  }
}
