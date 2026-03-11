import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { DashboardTasks } from "@/components/dashboard/dashboard-tasks"
import { DashboardFinancial } from "@/components/dashboard/dashboard-financial"
import { DashboardCentro } from "@/components/dashboard/dashboard-centro"
import type { Task, FinancialEntry, FinancialTarget } from "@/types"

async function getActiveWeekData(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: week } = await supabase
    .from("weeks")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .single()

  if (!week) return null

  const [tasksRes, entriesRes, targetRes] = await Promise.all([
    supabase.from("tasks").select("*").eq("week_id", week.id).order("created_at"),
    supabase.from("financial_entries").select("*").eq("week_id", week.id),
    supabase.from("financial_targets").select("*").eq("week_id", week.id).single(),
  ])

  return {
    week,
    tasks: (tasksRes.data || []) as Task[],
    entries: (entriesRes.data || []) as FinancialEntry[],
    target: targetRes.data as FinancialTarget | null,
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const data = await getActiveWeekData(supabase, user.id)

  if (!data) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground text-lg">No tenés una semana activa.</p>
            <p className="text-muted-foreground mt-2">
              Andá a <a href="/plan" className="underline font-medium text-foreground">Plan Semanal</a> para crear una.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { week, tasks, entries, target } = data

  const completedTasks = tasks.filter((t) => t.status === "completed").length
  const totalTasks = tasks.filter((t) => t.status !== "cancelled").length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const totalIncome = entries.filter((e) => e.type === "income").reduce((sum, e) => sum + Number(e.amount), 0)
  const totalExpenses = entries.filter((e) => e.type === "expense").reduce((sum, e) => sum + Number(e.amount), 0)
  const incomeTarget = target ? Number(target.income_target) : 0
  const incomeProgress = incomeTarget > 0 ? Math.round((totalIncome / incomeTarget) * 100) : 0

  const today = new Date().toISOString().split("T")[0]
  const todayTasks = tasks.filter((t) => t.due_date === today && t.status !== "cancelled")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <Badge variant="outline">
          {week.start_date} — {week.end_date}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avance Operativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completionRate}%</div>
            <Progress value={completionRate} className="mt-2" indicatorClassName={completionRate >= 80 ? "bg-success" : completionRate >= 50 ? "bg-warning" : "bg-destructive"} />
            <p className="text-xs text-muted-foreground mt-2">
              {completedTasks} de {totalTasks} tareas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos vs Meta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalIncome.toLocaleString()}</div>
            <Progress value={Math.min(incomeProgress, 100)} className="mt-2" indicatorClassName="bg-success" />
            <p className="text-xs text-muted-foreground mt-2">
              {incomeProgress}% de ${incomeTarget.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resultado Neto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-3xl font-bold", totalIncome - totalExpenses >= 0 ? "text-success" : "text-destructive")}>
              ${(totalIncome - totalExpenses).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Ingresos ${totalIncome.toLocaleString()} — Gastos ${totalExpenses.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DashboardTasks tasks={todayTasks} weekId={week.id} />
        <DashboardFinancial entries={entries} target={target} />
        <DashboardCentro userId={user.id} />
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
