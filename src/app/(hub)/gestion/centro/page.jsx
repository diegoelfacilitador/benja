"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import * as S from "@/lib/gestion/styles"

export default function CentroPage() {
  const supabase = createClient()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const scrollRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from("gestion_centro_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50)
      if (data) setMessages(data)
    }
    loadMessages()
  }, [supabase])

  useEffect(() => { scrollToBottom() }, [messages, streamingText, scrollToBottom])

  async function sendMessage(messageType = "chat", overrideMessage) {
    const messageText = overrideMessage || input.trim()
    if (!messageText || streaming) return

    const userMessage = {
      id: crypto.randomUUID(),
      user_id: "",
      role: "user",
      content: messageText,
      message_type: messageType,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setStreaming(true)
    setStreamingText("")

    try {
      const response = await fetch("/api/gestion/centro/chat", {
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
          fullText += decoder.decode(value, { stream: true })
          setStreamingText(fullText)
        }
      }

      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        user_id: "",
        role: "assistant",
        content: fullText,
        message_type: messageType,
        created_at: new Date().toISOString(),
      }])
    } catch (error) {
      console.error("Error:", error)
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        user_id: "",
        role: "assistant",
        content: "Error de conexión. Intentá de nuevo.",
        message_type: "chat",
        created_at: new Date().toISOString(),
      }])
    } finally {
      setStreaming(false)
      setStreamingText("")
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const messageTypeLabels = { morning_briefing: "Briefing", evening_review: "Review" }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}>
      <div style={{ ...S.flexBetween, marginBottom: 16 }}>
        <div>
          <h2 style={S.pageTitle}>Centro</h2>
          <p style={{ fontSize: 13, color: S.colors.textSecondary, marginTop: 2 }}>
            Tu mecanismo de control. Sin filtro.
          </p>
        </div>
        <div style={S.flexGap(8)}>
          <button
            style={S.buttonOutline}
            onClick={() => sendMessage("morning_briefing", "Dame el briefing de hoy")}
            disabled={streaming}
          >
            ☀️ Briefing
          </button>
          <button
            style={S.buttonOutline}
            onClick={() => sendMessage("evening_review", "Hacé la review del día")}
            disabled={streaming}
          >
            🌙 Review
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        ...S.card,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
          }}
        >
          {messages.length === 0 && !streaming ? (
            <div style={{ ...S.flexCenter, height: '100%', textAlign: 'center' }}>
              <div>
                <p style={{ color: S.colors.textSecondary, fontSize: 16, fontWeight: 500 }}>
                  Centro está listo.
                </p>
                <p style={{ color: S.colors.textSecondary, fontSize: 13, marginTop: 4 }}>
                  Podés pedirle el briefing del día, la review, o preguntarle lo que necesites.
                </p>
              </div>
            </div>
          ) : (
            <div style={S.spacingStack(12)}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === "user" ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '80%',
                    borderRadius: 12,
                    padding: '10px 16px',
                    background: msg.role === "user" ? S.colors.primary : S.colors.muted,
                    color: msg.role === "user" ? S.colors.primaryText : S.colors.text,
                  }}>
                    {msg.role === "assistant" && msg.message_type !== "chat" && (
                      <div style={{ marginBottom: 8 }}>
                        <span style={S.badge('secondary')}>
                          {messageTypeLabels[msg.message_type] || msg.message_type}
                        </span>
                      </div>
                    )}
                    <p style={{ fontSize: 13, whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.5 }}>
                      {msg.content}
                    </p>
                    <p style={{ fontSize: 10, opacity: 0.5, marginTop: 4, marginBottom: 0 }}>
                      {new Date(msg.created_at).toLocaleTimeString("es-AR", {
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {streaming && streamingText && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%', borderRadius: 12, padding: '10px 16px',
                    background: S.colors.muted,
                  }}>
                    <p style={{ fontSize: 13, whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.5 }}>
                      {streamingText}
                    </p>
                  </div>
                </div>
              )}

              {streaming && !streamingText && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ borderRadius: 12, padding: '10px 16px', background: S.colors.muted }}>
                    <p style={{ fontSize: 13, color: S.colors.textSecondary, margin: 0 }}>
                      Centro está pensando...
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ borderTop: `1px solid ${S.colors.border}`, padding: 16 }}>
          <div style={S.flexGap(8)}>
            <textarea
              style={{ ...S.textarea, flex: 1 }}
              placeholder="Escribí tu mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={streaming}
            />
            <button
              style={{
                ...S.buttonPrimary,
                ...S.buttonIcon,
                opacity: (!input.trim() || streaming) ? 0.5 : 1,
                cursor: (!input.trim() || streaming) ? 'not-allowed' : 'pointer',
              }}
              onClick={() => sendMessage()}
              disabled={!input.trim() || streaming}
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
