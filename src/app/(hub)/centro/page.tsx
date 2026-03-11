"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Sun, Moon } from "lucide-react"
import type { CentroMessage } from "@/types"

export default function CentroPage() {
  const supabase = createClient()
  const [messages, setMessages] = useState<CentroMessage[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from("centro_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50)
      if (data) setMessages(data as CentroMessage[])
    }
    loadMessages()
  }, [supabase])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingText, scrollToBottom])

  async function sendMessage(messageType: string = "chat", overrideMessage?: string) {
    const messageText = overrideMessage || input.trim()
    if (!messageText || streaming) return

    const userMessage: CentroMessage = {
      id: crypto.randomUUID(),
      user_id: "",
      role: "user",
      content: messageText,
      message_type: messageType as CentroMessage["message_type"],
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setStreaming(true)
    setStreamingText("")

    try {
      const response = await fetch("/api/centro/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, messageType }),
      })

      if (!response.ok) throw new Error("Error en la respuesta")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk
          setStreamingText(fullText)
        }
      }

      const assistantMessage: CentroMessage = {
        id: crypto.randomUUID(),
        user_id: "",
        role: "assistant",
        content: fullText,
        message_type: messageType as CentroMessage["message_type"],
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: CentroMessage = {
        id: crypto.randomUUID(),
        user_id: "",
        role: "assistant",
        content: "Error de conexión. Intentá de nuevo.",
        message_type: "chat",
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setStreaming(false)
      setStreamingText("")
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const messageTypeLabels: Record<string, string> = {
    morning_briefing: "Briefing",
    evening_review: "Review",
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Centro</h2>
          <p className="text-sm text-muted-foreground">Tu mecanismo de control. Sin filtro.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => sendMessage("morning_briefing", "Dame el briefing de hoy")}
            disabled={streaming}
          >
            <Sun className="h-3 w-3" />
            Briefing
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => sendMessage("evening_review", "Hacé la review del día")}
            disabled={streaming}
          >
            <Moon className="h-3 w-3" />
            Review
          </Button>
        </div>
      </div>

      {/* Messages */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          {messages.length === 0 && !streaming ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <p className="text-muted-foreground text-lg font-medium">Centro está listo.</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Podés pedirle el briefing del día, la review, o preguntarle lo que necesites.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.role === "assistant" && msg.message_type !== "chat" && (
                      <Badge variant="secondary" className="mb-2 text-[10px]">
                        {messageTypeLabels[msg.message_type] || msg.message_type}
                      </Badge>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-[10px] opacity-50 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {streaming && streamingText && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted">
                    <p className="text-sm whitespace-pre-wrap">{streamingText}</p>
                  </div>
                </div>
              )}

              {streaming && !streamingText && (
                <div className="flex justify-start">
                  <div className="rounded-lg px-4 py-3 bg-muted">
                    <p className="text-sm text-muted-foreground">Centro está pensando...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Escribí tu mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="resize-none min-h-[40px]"
              disabled={streaming}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || streaming}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
