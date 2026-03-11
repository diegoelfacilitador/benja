"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Play, Check } from "lucide-react"
import type { Week, Task, FinancialTarget } from "@/types"

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

export default function PlanPage() {
  const supabase = createClient()
  const [week, setWeek] = useState<Week | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [target, setTarget] = useState<FinancialTarget | null>(null)
  const [newTask, setNewTask] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState<string>("medium")
  const [newTaskDueDate, setNewTaskDueDate] = useState("")
  const [incomeTarget, setIncomeTarget] = useState("")
  const [expenseLimit, setExpenseLimit] = useState("")
  const [loading, setLoading] = useState(true)

  const loadWeek = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const monday = getMonday(new Date())
    const friday = new Date(monday)
    friday.setDate(friday.getDate() + 4)

    // Try to find existing week
    let { data: existingWeek } = await supabase
      .from("weeks")
      .select("*")
      .eq("user_id", user.id)
      .eq("start_date", formatDate(monday))
      .single()

    if (!existingWeek) {
      // Create new week
      const { data: newWeek } = await supabase
        .from("weeks")
        .insert({
          user_id: user.id,
          start_date: formatDate(monday),
          end_date: formatDate(friday),
          status: "planning",
        })
        .select()
        .single()
      existingWeek = newWeek
    }

    if (existingWeek) {
      setWeek(existingWeek)

      const [tasksRes, targetRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("week_id", existingWeek.id).order("created_at"),
        supabase.from("financial_targets").select("*").eq("week_id", existingWeek.id).single(),
      ])

      setTasks((tasksRes.data || []) as Task[])
      if (targetRes.data) {
        setTarget(targetRes.data as FinancialTarget)
        setIncomeTarget(String(targetRes.data.income_target))
        setExpenseLimit(String(targetRes.data.expense_limit))
      }
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadWeek()
  }, [loadWeek])

  async function addTask() {
    if (!newTask.trim() || !week) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("tasks")
      .insert({
        week_id: week.id,
        user_id: user.id,
        title: newTask.trim(),
        priority: newTaskPriority,
        due_date: newTaskDueDate || null,
      })
      .select()
      .single()

    if (data) {
      setTasks([...tasks, data as Task])
      setNewTask("")
      setNewTaskDueDate("")
    }
  }

  async function removeTask(taskId: string) {
    await supabase.from("tasks").delete().eq("id", taskId)
    setTasks(tasks.filter((t) => t.id !== taskId))
  }

  async function saveTargets() {
    if (!week) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (target) {
      await supabase
        .from("financial_targets")
        .update({
          income_target: Number(incomeTarget) || 0,
          expense_limit: Number(expenseLimit) || 0,
        })
        .eq("id", target.id)
    } else {
      const { data } = await supabase
        .from("financial_targets")
        .insert({
          week_id: week.id,
          user_id: user.id,
          income_target: Number(incomeTarget) || 0,
          expense_limit: Number(expenseLimit) || 0,
        })
        .select()
        .single()
      if (data) setTarget(data as FinancialTarget)
    }
  }

  async function activateWeek() {
    if (!week) return
    await supabase.from("weeks").update({ status: "active" }).eq("id", week.id)
    setWeek({ ...week, status: "active" })
  }

  async function completeWeek() {
    if (!week) return
    await supabase.from("weeks").update({ status: "completed" }).eq("id", week.id)
    setWeek({ ...week, status: "completed" })
  }

  if (loading) {
    return <div className="text-muted-foreground">Cargando...</div>
  }

  const statusColors: Record<string, "default" | "warning" | "success"> = {
    planning: "warning",
    active: "default",
    completed: "success",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Plan Semanal</h2>
        {week && (
          <div className="flex items-center gap-3">
            <Badge variant={statusColors[week.status]}>
              {week.status === "planning" ? "Planificando" : week.status === "active" ? "Activa" : "Completada"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {week.start_date} — {week.end_date}
            </span>
          </div>
        )}
      </div>

      {/* Tareas */}
      <Card>
        <CardHeader>
          <CardTitle>Carga Operativa</CardTitle>
          <CardDescription>Definí las tareas que te comprometés a completar esta semana.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add task form */}
          {week?.status !== "completed" && (
            <div className="flex gap-2">
              <Input
                placeholder="Nueva tarea..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                className="flex-1"
              />
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="border rounded-md px-2 text-sm bg-background"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
              <Input
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="w-40"
              />
              <Button onClick={addTask} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Task list */}
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No hay tareas todavía. Agregá tu primera tarea arriba.
              </p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{task.title}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {task.priority}
                    </Badge>
                    {task.due_date && (
                      <span className="text-xs text-muted-foreground">{task.due_date}</span>
                    )}
                  </div>
                  {week?.status !== "completed" && (
                    <Button variant="ghost" size="icon" onClick={() => removeTask(task.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metas Financieras */}
      <Card>
        <CardHeader>
          <CardTitle>Metas Financieras</CardTitle>
          <CardDescription>Definí tu objetivo de ingreso y límite de gasto semanal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground">Meta de Ingresos ($)</label>
              <Input
                type="number"
                placeholder="0"
                value={incomeTarget}
                onChange={(e) => setIncomeTarget(e.target.value)}
                disabled={week?.status === "completed"}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground">Límite de Gastos ($)</label>
              <Input
                type="number"
                placeholder="0"
                value={expenseLimit}
                onChange={(e) => setExpenseLimit(e.target.value)}
                disabled={week?.status === "completed"}
              />
            </div>
            {week?.status !== "completed" && (
              <div className="flex items-end">
                <Button variant="outline" onClick={saveTargets}>
                  Guardar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {week?.status === "planning" && tasks.length > 0 && (
        <Button onClick={activateWeek} className="gap-2">
          <Play className="h-4 w-4" />
          Activar Semana
        </Button>
      )}
      {week?.status === "active" && (
        <Button onClick={completeWeek} variant="outline" className="gap-2">
          <Check className="h-4 w-4" />
          Cerrar Semana
        </Button>
      )}
    </div>
  )
}
