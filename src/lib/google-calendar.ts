import { google } from "googleapis"
import { createClient } from "@/lib/supabase/server"

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.readonly"],
    prompt: "consent",
  })
}

export async function handleCallback(code: string, userId: string) {
  const { tokens } = await oauth2Client.getToken(code)

  const supabase = await createClient()
  await supabase.from("google_calendar_tokens").upsert({
    user_id: userId,
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    expiry_date: new Date(tokens.expiry_date!).toISOString(),
  })

  return tokens
}

export async function getCalendarEvents(userId: string, date: string) {
  const supabase = await createClient()

  const { data: tokenData } = await supabase
    .from("google_calendar_tokens")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (!tokenData) return []

  oauth2Client.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
  })

  // Check if token needs refresh
  if (new Date(tokenData.expiry_date) <= new Date()) {
    const { credentials } = await oauth2Client.refreshAccessToken()
    await supabase
      .from("google_calendar_tokens")
      .update({
        access_token: credentials.access_token!,
        expiry_date: new Date(credentials.expiry_date!).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
  }

  const calendar = google.calendar({ version: "v3", auth: oauth2Client })

  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
  })

  return (response.data.items || []).map((event) => ({
    id: event.id || "",
    summary: event.summary || "Sin título",
    start: event.start?.dateTime || event.start?.date || "",
    end: event.end?.dateTime || event.end?.date || "",
    description: event.description || undefined,
  }))
}
