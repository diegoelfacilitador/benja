"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { Task, Week } from "@/types"

const priorityColors: Record<string, "default" | "secondary" | "destructive" | "warning"> = {
  low: "secondary",
  medium: "default",
  high: "warning",
  critical: "destructive",
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completada",
  cancelled: "Cancelada",
}

export default function OperativoPage() {
  const supabase = createClient()
  const [week, setWeek] = useState<Week | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: activeWeek } = await supabase
      .from("weeks")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "completed"])
      .order("start_date", { ascending: false })
      .limit(1)
      .single()

    if (activeWeek) {
      setWeek(activeWeek)
      const { data: weekTasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("week_id", activeWeek.id)
        .order("created_at")

      setTasks((weekTasks || []) as Task[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function updateTaskStatus(taskId: string, newStatus: string) {
    await supabase
      .from("tasks")
      .update({
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", taskId)

    setTasks(tasks.map((t) =>
      t.id === taskId
        ? { ...t, status: newStatus as Task["status"], completed_at: newStatus === "completed" ? new Date().toISOString() : null }
        : t
    ))
  }

  if (loading) return <div className="text-muted-foreground">Cargando...</div>

  if (!week) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Operativo</h2>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No hay una semana activa. Creá una en Plan Semanal.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeTasks = tasks.filter((t) => t.status !== "cancelled")
  const completedCount = activeTasks.filter((t) => t.status === "completed").length
  const completionRate = activeTasks.length > 0 ? Math.round((completedCount / activeTasks.length) * 100) : 0

  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => t.status === filter)

  // Group tasks by due date
  const tasksByDate: Record<string, Task[]> = {}
  filteredTasks.forEach((task) => {
    const key = task.due_date || "Sin fecha"
    if (!tasksByDate[key]) tasksByDate[key] = []
    tasksByDate[key].push(task)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Operativo</h2>
        <Badge variant="outline">{week.start_date} — {week.end_date}</Badge>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Avance semanal</span>
            <span className="text-2xl font-bold">{completionRate}%</span>
          </div>
          <Progress
            value={completionRate}
            className="h-3"
            indicatorClassName={
              completionRate >= 80 ? "bg-success" : completionRate >= 50 ? "bg-warning" : "bg-destructive"
            }
          />
          <p className="text-xs text-muted-foreground mt-2">
            {completedCount} de {activeTasks.length} tareas completadas
          </p>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "pending", "in_progress", "completed", "cancelled"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Todas" : statusLabels[f]}
          </Button>
        ))}
      </div>

      {/* Tasks by date */}
      {Object.entries(tasksByDate)
        .sort(([a], [b]) => (a === "Sin fecha" ? 1 : b === "Sin fecha" ? -1 : a.localeCompare(b)))
        .map(([date, dateTasks]) => (
          <Card key={date}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {date === "Sin fecha" ? "Sin fecha asignada" : new Date(date + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dateTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={task.status === "completed"}
                      onChange={() =>
                        updateTaskStatus(task.id, task.status === "completed" ? "pending" : "completed")
                      }
                      className="h-4 w-4 cursor-pointer"
                      disabled={week.status === "completed"}
                    />
                    <span className={`text-sm ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </span>
                    <Badge variant={priorityColors[task.priority]} className="text-[10px]">
                      {task.priority}
                    </Badge>
                  </div>
                  {week.status !== "completed" && task.status !== "completed" && task.status !== "cancelled" && (
                    <div className="flex gap-1">
                      {task.status === "pending" && (
                        <Button size="sm" variant="ghost" onClick={() => updateTaskStatus(task.id, "in_progress")}>
                          Iniciar
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => updateTaskStatus(task.id, "cancelled")}>
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
    </div>
  )
}
