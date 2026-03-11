"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { Task } from "@/types"

const priorityColors: Record<string, "default" | "secondary" | "destructive" | "warning"> = {
  low: "secondary",
  medium: "default",
  high: "warning",
  critical: "destructive",
}

export function DashboardTasks({ tasks, weekId }: { tasks: Task[]; weekId: string }) {
  const router = useRouter()

  async function toggleTask(taskId: string, currentStatus: string) {
    const supabase = createClient()
    const newStatus = currentStatus === "completed" ? "pending" : "completed"
    await supabase
      .from("tasks")
      .update({
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", taskId)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Tareas de Hoy</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay tareas para hoy.</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={task.status === "completed"}
                  onChange={() => toggleTask(task.id, task.status)}
                  className="mt-0.5 h-4 w-4 rounded border-input cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </p>
                </div>
                <Badge variant={priorityColors[task.priority]} className="text-[10px]">
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
