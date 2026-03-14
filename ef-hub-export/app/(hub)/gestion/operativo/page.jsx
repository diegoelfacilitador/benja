"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import * as S from "@/lib/gestion/styles"

const statusLabels = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completada",
  cancelled: "Cancelada",
}

export default function OperativoPage() {
  const supabase = createClient()
  const [week, setWeek] = useState(null)
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: activeWeek } = await supabase
      .from("gestion_weeks")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "completed"])
      .order("start_date", { ascending: false })
      .limit(1)
      .single()

    if (activeWeek) {
      setWeek(activeWeek)
      const { data: weekTasks } = await supabase
        .from("gestion_tasks")
        .select("*")
        .eq("week_id", activeWeek.id)
        .order("created_at")
      setTasks(weekTasks || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  async function updateTaskStatus(taskId, newStatus) {
    await supabase
      .from("gestion_tasks")
      .update({
        status: newStatus,
        completed_at: newStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", taskId)

    setTasks(tasks.map((t) =>
      t.id === taskId
        ? { ...t, status: newStatus, completed_at: newStatus === "completed" ? new Date().toISOString() : null }
        : t
    ))
  }

  if (loading) return <p style={{ color: S.colors.textSecondary }}>Cargando...</p>

  if (!week) {
    return (
      <div>
        <h2 style={S.pageTitle}>Operativo</h2>
        <div style={{ ...S.card, marginTop: 24 }}>
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ color: S.colors.textSecondary }}>No hay una semana activa. Creá una en Plan Semanal.</p>
          </div>
        </div>
      </div>
    )
  }

  const activeTasks = tasks.filter((t) => t.status !== "cancelled")
  const completedCount = activeTasks.filter((t) => t.status === "completed").length
  const completionRate = activeTasks.length > 0 ? Math.round((completedCount / activeTasks.length) * 100) : 0
  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => t.status === filter)

  // Group by due date
  const tasksByDate = {}
  filteredTasks.forEach((task) => {
    const key = task.due_date || "Sin fecha"
    if (!tasksByDate[key]) tasksByDate[key] = []
    tasksByDate[key].push(task)
  })

  const priorityBadge = {
    low: 'secondary', medium: 'default', high: 'warning', critical: 'destructive',
  }

  return (
    <div style={S.spacingStack(24)}>
      <div style={S.flexBetween}>
        <h2 style={S.pageTitle}>Operativo</h2>
        <span style={S.badge('outline')}>{week.start_date} — {week.end_date}</span>
      </div>

      {/* Progress */}
      <div style={S.card}>
        <div style={{ padding: 24 }}>
          <div style={S.flexBetween}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Avance semanal</span>
            <span style={{ fontSize: 24, fontWeight: 700 }}>{completionRate}%</span>
          </div>
          <div style={{ ...S.progressBar, height: 12, marginTop: 8 }}>
            <div style={S.progressIndicator(
              completionRate,
              completionRate >= 80 ? S.colors.success : completionRate >= 50 ? S.colors.warning : S.colors.error
            )} />
          </div>
          <p style={{ fontSize: 12, color: S.colors.textSecondary, marginTop: 8 }}>
            {completedCount} de {activeTasks.length} tareas completadas
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={S.flexGap(8)}>
        {["all", "pending", "in_progress", "completed", "cancelled"].map((f) => (
          <button
            key={f}
            style={filter === f ? S.buttonPrimary : S.buttonOutline}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Todas" : statusLabels[f]}
          </button>
        ))}
      </div>

      {/* Tasks by date */}
      {Object.entries(tasksByDate)
        .sort(([a], [b]) => (a === "Sin fecha" ? 1 : b === "Sin fecha" ? -1 : a.localeCompare(b)))
        .map(([date, dateTasks]) => (
          <div key={date} style={S.card}>
            <div style={S.cardHeader}>
              <h3 style={S.cardTitle}>
                {date === "Sin fecha"
                  ? "Sin fecha asignada"
                  : new Date(date + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
                }
              </h3>
            </div>
            <div style={{ ...S.cardContent, ...S.spacingStack(8) }}>
              {dateTasks.map((task) => (
                <div key={task.id} style={S.listItem}>
                  <div style={S.flexGap(12)}>
                    <input
                      type="checkbox"
                      checked={task.status === "completed"}
                      onChange={() => updateTaskStatus(task.id, task.status === "completed" ? "pending" : "completed")}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                      disabled={week.status === "completed"}
                    />
                    <span style={{
                      fontSize: 13,
                      textDecoration: task.status === "completed" ? 'line-through' : 'none',
                      color: task.status === "completed" ? S.colors.textSecondary : S.colors.text,
                    }}>{task.title}</span>
                    <span style={S.badge(priorityBadge[task.priority])}>{task.priority}</span>
                  </div>
                  {week.status !== "completed" && task.status !== "completed" && task.status !== "cancelled" && (
                    <div style={S.flexGap(4)}>
                      {task.status === "pending" && (
                        <button style={S.buttonGhost} onClick={() => updateTaskStatus(task.id, "in_progress")}>
                          Iniciar
                        </button>
                      )}
                      <button style={S.buttonGhost} onClick={() => updateTaskStatus(task.id, "cancelled")}>
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      }
    </div>
  )
}
