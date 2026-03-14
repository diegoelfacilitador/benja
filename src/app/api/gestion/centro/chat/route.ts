import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Anthropic from "@anthropic-ai/sdk"
import { CENTRO_SYSTEM_PROMPT, MORNING_BRIEFING_INSTRUCTION, EVENING_REVIEW_INSTRUCTION } from "@/lib/gestion/system-prompt"
import { buildCentroContext, contextToPrompt } from "@/lib/gestion/context-builder"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { message, messageType = "chat" } = await req.json()

  // Build context
  const context = await buildCentroContext(user.id)
  const contextPrompt = context ? contextToPrompt(context) : "No hay una semana activa. El usuario no tiene datos cargados."

  // Get recent conversation history
  const { data: history } = await supabase
    .from("gestion_centro_messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  const conversationHistory = (history || [])
    .reverse()
    .map((msg: any) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))
    .filter((msg: any) => msg.role === "user" || msg.role === "assistant")

  // Build user message
  let userMessage = message
  if (messageType === "morning_briefing") {
    userMessage = MORNING_BRIEFING_INSTRUCTION + "\n\nEl usuario dice: " + message
  } else if (messageType === "evening_review") {
    userMessage = EVENING_REVIEW_INSTRUCTION + "\n\nEl usuario dice: " + message
  }

  // Save user message
  await supabase.from("gestion_centro_messages").insert({
    user_id: user.id,
    role: "user",
    content: message,
    message_type: messageType,
  })

  // Call Claude with streaming
  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: CENTRO_SYSTEM_PROMPT + "\n\n" + contextPrompt,
    messages: [
      ...conversationHistory,
      { role: "user", content: userMessage },
    ],
  })

  const encoder = new TextEncoder()
  let fullResponse = ""

  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          const text = event.delta.text
          fullResponse += text
          controller.enqueue(encoder.encode(text))
        }
      }

      await supabase.from("gestion_centro_messages").insert({
        user_id: user.id,
        role: "assistant",
        content: fullResponse,
        message_type: messageType,
      })

      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  })
}
