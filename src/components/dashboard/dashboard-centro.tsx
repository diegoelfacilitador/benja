"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { MessageSquare } from "lucide-react"
import Link from "next/link"
import type { CentroMessage } from "@/types"

export function DashboardCentro({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<CentroMessage[]>([])

  useEffect(() => {
    async function loadMessages() {
      const supabase = createClient()
      const { data } = await supabase
        .from("centro_messages")
        .select("*")
        .eq("user_id", userId)
        .eq("role", "assistant")
        .order("created_at", { ascending: false })
        .limit(3)

      if (data) setMessages(data)
    }
    loadMessages()
  }, [userId])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Centro</CardTitle>
        <Link href="/centro">
          <Button variant="ghost" size="sm" className="gap-2">
            <MessageSquare className="h-3 w-3" />
            Abrir chat
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Centro todavía no tiene mensajes. Abrí el chat para empezar.
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <p className="text-muted-foreground line-clamp-2">{msg.content}</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {new Date(msg.created_at).toLocaleString("es-AR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
