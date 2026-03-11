import { createClient } from "@/lib/supabase/server"
import { getCalendarEvents } from "@/lib/google-calendar"
import type { Task, FinancialEntry, FinancialTarget, CalendarEvent } from "@/types"

export interface CentroContext {
  operational: {
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    pendingTasks: number
    completionRate: number
    taskList: { title: string; status: string; priority: string; dueDate: string | null }[]
  }
  financial: {
    totalIncome: number
    totalExpenses: number
    netResult: number
    incomeTarget: number
    expenseLimit: number
    incomeProgress: number
    expenseUsage: number
  }
  calendar: {
    events: CalendarEvent[]
  }
  weekInfo: {
    startDate: string
    endDate: string
    status: string
    dayOfWeek: string
  }
}

export async function buildCentroContext(userId: string): Promise<CentroContext | null> {
  const supabase = await createClient()

  // Get active week
  const { data: week } = await supabase
    .from("weeks")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active"])
    .order("start_date", { ascending: false })
    .limit(1)
    .single()

  if (!week) return null

  // Get tasks, financial entries, and targets
  const [tasksRes, entriesRes, targetRes] = await Promise.all([
    supabase.from("tasks").select("*").eq("week_id", week.id).order("created_at"),
    supabase.from("financial_entries").select("*").eq("week_id", week.id),
    supabase.from("financial_targets").select("*").eq("week_id", week.id).single(),
  ])

  const tasks = (tasksRes.data || []) as Task[]
  const entries = (entriesRes.data || []) as FinancialEntry[]
  const target = targetRes.data as FinancialTarget | null

  const activeTasks = tasks.filter((t) => t.status !== "cancelled")
  const completedTasks = activeTasks.filter((t) => t.status === "completed").length
  const inProgressTasks = activeTasks.filter((t) => t.status === "in_progress").length
  const pendingTasks = activeTasks.filter((t) => t.status === "pending").length

  const totalIncome = entries.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0)
  const totalExpenses = entries.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0)
  const incomeTarget = target ? Number(target.income_target) : 0
  const expenseLimit = target ? Number(target.expense_limit) : 0

  const days = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]

  return {
    operational: {
      totalTasks: activeTasks.length,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionRate: activeTasks.length > 0 ? Math.round((completedTasks / activeTasks.length) * 100) : 0,
      taskList: activeTasks.map((t) => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.due_date,
      })),
    },
    financial: {
      totalIncome,
      totalExpenses,
      netResult: totalIncome - totalExpenses,
      incomeTarget,
      expenseLimit,
      incomeProgress: incomeTarget > 0 ? Math.round((totalIncome / incomeTarget) * 100) : 0,
      expenseUsage: expenseLimit > 0 ? Math.round((totalExpenses / expenseLimit) * 100) : 0,
    },
    calendar: {
      events: await loadCalendarEvents(userId),
    },
    weekInfo: {
      startDate: week.start_date,
      endDate: week.end_date,
      status: week.status,
      dayOfWeek: days[new Date().getDay()],
    },
  }
}

async function loadCalendarEvents(userId: string): Promise<CalendarEvent[]> {
  try {
    const today = new Date().toISOString().split("T")[0]
    return await getCalendarEvents(userId, today)
  } catch {
    return []
  }
}

export function contextToPrompt(ctx: CentroContext): string {
  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  let prompt = `## DATOS ACTUALES (${today})

### Semana: ${ctx.weekInfo.startDate} a ${ctx.weekInfo.endDate} (${ctx.weekInfo.dayOfWeek})

### OPERATIVO
- Tareas totales: ${ctx.operational.totalTasks}
- Completadas: ${ctx.operational.completedTasks} (${ctx.operational.completionRate}%)
- En progreso: ${ctx.operational.inProgressTasks}
- Pendientes: ${ctx.operational.pendingTasks}
`

  if (ctx.operational.taskList.length > 0) {
    prompt += `\nDetalle de tareas:\n`
    ctx.operational.taskList.forEach((t) => {
      prompt += `- [${t.status}] ${t.title} (prioridad: ${t.priority}${t.dueDate ? `, fecha: ${t.dueDate}` : ""})\n`
    })
  }

  prompt += `
### FINANCIERO
- Ingresos: $${ctx.financial.totalIncome.toLocaleString()} ${ctx.financial.incomeTarget > 0 ? `(${ctx.financial.incomeProgress}% de meta $${ctx.financial.incomeTarget.toLocaleString()})` : "(sin meta definida)"}
- Gastos: $${ctx.financial.totalExpenses.toLocaleString()} ${ctx.financial.expenseLimit > 0 ? `(${ctx.financial.expenseUsage}% de límite $${ctx.financial.expenseLimit.toLocaleString()})` : "(sin límite definido)"}
- Resultado neto: $${ctx.financial.netResult.toLocaleString()}
`

  if (ctx.calendar.events.length > 0) {
    prompt += `\n### CALENDARIO DE HOY\n`
    ctx.calendar.events.forEach((e) => {
      prompt += `- ${e.start} - ${e.end}: ${e.summary}\n`
    })
  } else {
    prompt += `\n### CALENDARIO: Sin eventos cargados para hoy.\n`
  }

  return prompt
}
