import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCalendarEvents } from "@/lib/google-calendar"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const date = req.nextUrl.searchParams.get("date") || new Date().toISOString().split("T")[0]

  try {
    const events = await getCalendarEvents(user.id, date)
    return NextResponse.json({ events })
  } catch (error) {
    console.error("Calendar events error:", error)
    return NextResponse.json({ events: [], error: "Failed to fetch events" }, { status: 200 })
  }
}
