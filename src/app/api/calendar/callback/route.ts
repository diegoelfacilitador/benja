import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { handleCallback } from "@/lib/google-calendar"

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard?error=no_code", req.url))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  try {
    await handleCallback(code, user.id)
    return NextResponse.redirect(new URL("/dashboard?calendar=connected", req.url))
  } catch (error) {
    console.error("Google Calendar callback error:", error)
    return NextResponse.redirect(new URL("/dashboard?error=calendar_auth", req.url))
  }
}
