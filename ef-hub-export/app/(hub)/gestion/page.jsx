import { createClient } from "@/lib/supabase/server"
import * as S from "@/lib/gestion/styles"

export const dynamic = "force-dynamic"

async function getActiveWeekData(supabase, userId) {
  const { data: week } = await supabase
    .from("gestion_weeks")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("start_date", { ascending: false })
    .limit(1)
    .single()

  if (!week) return null

  const [tasksRes, entriesRes, targetRes] = await Promise.all([
    supabase.from("gestion_tasks").select("*").eq("week_id", week.id).order("created_at"),
    supabase.from("gestion_financial_entries").select("*").eq("week_id", week.id),
    supabase.from("gestion_financial_targets").select("*").eq("week_id", week.id).single(),
  ])

  return {
    week,
    tasks: tasksRes.data || [],
    entries: entriesRes.data || [],
    target: targetRes.data || null,
  }
}

function KpiCard({ title, value, subtitle, percent, color }) {
  return (
    <div style={S.card}>
      <div style={{ padding: 24 }}>
        <p style={{ fontSize: 13, color: S.colors.textSecondary, marginBottom: 8 }}>{title}</p>
        <p style={{ fontSize: 28, fontWeight: 700, color: S.colors.text, margin: 0 }}>{value}</p>
        {percent !== undefined && (
          <div style={{ ...S.progressBar, marginTop: 8 }}>
            <div style={S.progressIndicator(percent, color || S.colors.primary)} />
          </div>
        )}
        {subtitle && (
          <p style={{ fontSize: 12, color: S.colors.textSecondary, marginTop: 8 }}>{subtitle}</p>
        )}
      </div>
    </div>
  )
}

export default async function GestionDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const data = await getActiveWeekData(supabase, user.id)

  if (!data) {
    return (
      <div>
        <h2 style={S.pageTitle}>Dashboard</h2>
        <div style={{ ...S.card, marginTop: 24 }}>
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ color: S.colors.textSecondary, fontSize: 16 }}>No tenés una semana activa.</p>
            <p style={{ color: S.colors.textSecondary, marginTop: 8 }}>
              Andá a <a href="/gestion/plan" style={{ color: S.colors.text, textDecoration: 'underline' }}>Plan Semanal</a> para crear una.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { week, tasks, entries, target } = data
  const activeTasks = tasks.filter((t) => t.status !== "cancelled")
  const completedTasks = activeTasks.filter((t) => t.status === "completed").length
  const completionRate = activeTasks.length > 0 ? Math.round((completedTasks / activeTasks.length) * 100) : 0

  const totalIncome = entries.filter((e) => e.type === "income").reduce((sum, e) => sum + Number(e.amount), 0)
  const totalExpenses = entries.filter((e) => e.type === "expense").reduce((sum, e) => sum + Number(e.amount), 0)
  const incomeTarget = target ? Number(target.income_target) : 0
  const incomeProgress = incomeTarget > 0 ? Math.round((totalIncome / incomeTarget) * 100) : 0
  const netResult = totalIncome - totalExpenses

  const today = new Date().toISOString().split("T")[0]
  const todayTasks = tasks.filter((t) => t.due_date === today && t.status !== "cancelled")

  return (
    <div style={S.spacingStack(24)}>
      <div style={S.flexBetween}>
        <h2 style={S.pageTitle}>Dashboard</h2>
        <span style={S.badge('outline')}>{week.start_date} — {week.end_date}</span>
      </div>

      {/* KPIs */}
      <div style={S.grid(3, 16)}>
        <KpiCard
          title="Avance Operativo"
          value={`${completionRate}%`}
          subtitle={`${completedTasks} de ${activeTasks.length} tareas`}
          percent={completionRate}
          color={completionRate >= 80 ? S.colors.success : completionRate >= 50 ? S.colors.warning : S.colors.error}
        />
        <KpiCard
          title="Ingresos vs Meta"
          value={`$${totalIncome.toLocaleString()}`}
          subtitle={`${incomeProgress}% de $${incomeTarget.toLocaleString()}`}
          percent={incomeProgress}
          color={S.colors.success}
        />
        <KpiCard
          title="Resultado Neto"
          value={`$${netResult.toLocaleString()}`}
          subtitle={`Ingresos $${totalIncome.toLocaleString()} — Gastos $${totalExpenses.toLocaleString()}`}
          color={netResult >= 0 ? S.colors.success : S.colors.error}
        />
      </div>

      {/* Today's tasks */}
      <div style={S.grid(2, 16)}>
        <div style={S.card}>
          <div style={S.cardHeader}>
            <h3 style={S.cardTitle}>Tareas de Hoy</h3>
          </div>
          <div style={S.cardContent}>
            {todayTasks.length === 0 ? (
              <p style={{ fontSize: 13, color: S.colors.textSecondary }}>No hay tareas para hoy.</p>
            ) : (
              <div style={S.spacingStack(8)}>
                {todayTasks.map((task) => (
                  <div key={task.id} style={{ ...S.flexGap(12), fontSize: 13 }}>
                    <span>{task.status === "completed" ? "✅" : "⬜"}</span>
                    <span style={{
                      textDecoration: task.status === "completed" ? 'line-through' : 'none',
                      color: task.status === "completed" ? S.colors.textSecondary : S.colors.text,
                    }}>{task.title}</span>
                    <span style={S.badge(
                      task.priority === 'critical' ? 'destructive' :
                      task.priority === 'high' ? 'warning' :
                      task.priority === 'medium' ? 'default' : 'secondary'
                    )}>{task.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Financial summary */}
        <div style={S.card}>
          <div style={S.cardHeader}>
            <h3 style={S.cardTitle}>Resumen Financiero</h3>
          </div>
          <div style={S.cardContent}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <p style={{ fontSize: 12, color: S.colors.textSecondary }}>Ingresos</p>
                <p style={{ fontSize: 18, fontWeight: 600, color: S.colors.success }}>
                  ${totalIncome.toLocaleString()}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: S.colors.textSecondary }}>Gastos</p>
                <p style={{ fontSize: 18, fontWeight: 600, color: S.colors.error }}>
                  ${totalExpenses.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
