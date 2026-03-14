"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import * as S from "@/lib/gestion/styles"

function getMonday(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(date) {
  return date.toISOString().split("T")[0]
}

export default function PlanPage() {
  const supabase = createClient()
  const [week, setWeek] = useState(null)
  const [tasks, setTasks] = useState([])
  const [target, setTarget] = useState(null)
  const [newTask, setNewTask] = useState("")
  const [newTaskPriority, setNewTaskPriority] = useState("medium")
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

    let { data: existingWeek } = await supabase
      .from("gestion_weeks")
      .select("*")
      .eq("user_id", user.id)
      .eq("start_date", formatDate(monday))
      .single()

    if (!existingWeek) {
      const { data: newWeek } = await supabase
        .from("gestion_weeks")
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
        supabase.from("gestion_tasks").select("*").eq("week_id", existingWeek.id).order("created_at"),
        supabase.from("gestion_financial_targets").select("*").eq("week_id", existingWeek.id).single(),
      ])
      setTasks(tasksRes.data || [])
      if (targetRes.data) {
        setTarget(targetRes.data)
        setIncomeTarget(String(targetRes.data.income_target))
        setExpenseLimit(String(targetRes.data.expense_limit))
      }
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadWeek() }, [loadWeek])

  async function addTask() {
    if (!newTask.trim() || !week) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("gestion_tasks")
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
      setTasks([...tasks, data])
      setNewTask("")
      setNewTaskDueDate("")
    }
  }

  async function removeTask(taskId) {
    await supabase.from("gestion_tasks").delete().eq("id", taskId)
    setTasks(tasks.filter((t) => t.id !== taskId))
  }

  async function saveTargets() {
    if (!week) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (target) {
      await supabase
        .from("gestion_financial_targets")
        .update({ income_target: Number(incomeTarget) || 0, expense_limit: Number(expenseLimit) || 0 })
        .eq("id", target.id)
    } else {
      const { data } = await supabase
        .from("gestion_financial_targets")
        .insert({
          week_id: week.id,
          user_id: user.id,
          income_target: Number(incomeTarget) || 0,
          expense_limit: Number(expenseLimit) || 0,
        })
        .select()
        .single()
      if (data) setTarget(data)
    }
  }

  async function activateWeek() {
    if (!week) return
    await supabase.from("gestion_weeks").update({ status: "active" }).eq("id", week.id)
    setWeek({ ...week, status: "active" })
  }

  async function completeWeek() {
    if (!week) return
    await supabase.from("gestion_weeks").update({ status: "completed" }).eq("id", week.id)
    setWeek({ ...week, status: "completed" })
  }

  if (loading) return <p style={{ color: S.colors.textSecondary }}>Cargando...</p>

  const statusLabel = { planning: "Planificando", active: "Activa", completed: "Completada" }
  const statusBadge = { planning: "warning", active: "default", completed: "success" }

  return (
    <div style={S.spacingStack(24)}>
      <div style={S.flexBetween}>
        <h2 style={S.pageTitle}>Plan Semanal</h2>
        {week && (
          <div style={S.flexGap(12)}>
            <span style={S.badge(statusBadge[week.status])}>{statusLabel[week.status]}</span>
            <span style={{ fontSize: 13, color: S.colors.textSecondary }}>
              {week.start_date} — {week.end_date}
            </span>
          </div>
        )}
      </div>

      {/* Tasks */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <h3 style={S.cardTitleLarge}>Carga Operativa</h3>
          <p style={S.cardDescription}>Definí las tareas que te comprometés a completar esta semana.</p>
        </div>
        <div style={S.cardContent}>
          {week?.status !== "completed" && (
            <div style={{ ...S.flexGap(8), marginBottom: 16 }}>
              <input
                style={{ ...S.input, flex: 1 }}
                placeholder="Nueva tarea..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
              />
              <select style={{ ...S.select, width: 'auto' }} value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)}>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
              <input
                type="date"
                style={{ ...S.input, width: 160 }}
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
              />
              <button style={S.buttonPrimary} onClick={addTask}>+</button>
            </div>
          )}

          <div style={S.spacingStack(8)}>
            {tasks.length === 0 ? (
              <p style={{ fontSize: 13, color: S.colors.textSecondary, textAlign: 'center', padding: 16 }}>
                No hay tareas todavía. Agregá tu primera tarea arriba.
              </p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} style={S.listItem}>
                  <div style={S.flexGap(12)}>
                    <span style={{ fontSize: 13 }}>{task.title}</span>
                    <span style={S.badge('secondary')}>{task.priority}</span>
                    {task.due_date && (
                      <span style={{ fontSize: 11, color: S.colors.textSecondary }}>{task.due_date}</span>
                    )}
                  </div>
                  {week?.status !== "completed" && (
                    <button
                      style={S.buttonGhost}
                      onClick={() => removeTask(task.id)}
                    >🗑</button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Financial Targets */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <h3 style={S.cardTitleLarge}>Metas Financieras</h3>
          <p style={S.cardDescription}>Definí tu objetivo de ingreso y límite de gasto semanal.</p>
        </div>
        <div style={S.cardContent}>
          <div style={S.flexGap(16)}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: S.colors.textSecondary, display: 'block', marginBottom: 4 }}>
                Meta de Ingresos ($)
              </label>
              <input
                type="number"
                style={S.input}
                placeholder="0"
                value={incomeTarget}
                onChange={(e) => setIncomeTarget(e.target.value)}
                disabled={week?.status === "completed"}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: S.colors.textSecondary, display: 'block', marginBottom: 4 }}>
                Límite de Gastos ($)
              </label>
              <input
                type="number"
                style={S.input}
                placeholder="0"
                value={expenseLimit}
                onChange={(e) => setExpenseLimit(e.target.value)}
                disabled={week?.status === "completed"}
              />
            </div>
            {week?.status !== "completed" && (
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button style={S.buttonOutline} onClick={saveTargets}>Guardar</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {week?.status === "planning" && tasks.length > 0 && (
        <button style={S.buttonPrimary} onClick={activateWeek}>▶ Activar Semana</button>
      )}
      {week?.status === "active" && (
        <button style={S.buttonOutline} onClick={completeWeek}>✓ Cerrar Semana</button>
      )}
    </div>
  )
}
