"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react"
import type { Week, FinancialEntry, FinancialTarget } from "@/types"

const categories = {
  income: ["Ventas", "Servicios", "Consultoría", "Otro ingreso"],
  expense: ["Herramientas", "Marketing", "Equipo", "Oficina", "Servicios", "Impuestos", "Otro gasto"],
}

export default function FinancieroPage() {
  const supabase = createClient()
  const [week, setWeek] = useState<Week | null>(null)
  const [entries, setEntries] = useState<FinancialEntry[]>([])
  const [target, setTarget] = useState<FinancialTarget | null>(null)
  const [loading, setLoading] = useState(true)

  // New entry form
  const [entryType, setEntryType] = useState<"income" | "expense">("income")
  const [entryAmount, setEntryAmount] = useState("")
  const [entryCategory, setEntryCategory] = useState("")
  const [entryDescription, setEntryDescription] = useState("")
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0])

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
      const [entriesRes, targetRes] = await Promise.all([
        supabase.from("financial_entries").select("*").eq("week_id", activeWeek.id).order("date", { ascending: false }),
        supabase.from("financial_targets").select("*").eq("week_id", activeWeek.id).single(),
      ])
      setEntries((entriesRes.data || []) as FinancialEntry[])
      if (targetRes.data) setTarget(targetRes.data as FinancialTarget)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function addEntry() {
    if (!entryAmount || !entryCategory || !week) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("financial_entries")
      .insert({
        week_id: week.id,
        user_id: user.id,
        type: entryType,
        amount: Number(entryAmount),
        category: entryCategory,
        description: entryDescription || null,
        date: entryDate,
      })
      .select()
      .single()

    if (data) {
      setEntries([data as FinancialEntry, ...entries])
      setEntryAmount("")
      setEntryDescription("")
    }
  }

  async function deleteEntry(id: string) {
    await supabase.from("financial_entries").delete().eq("id", id)
    setEntries(entries.filter((e) => e.id !== id))
  }

  if (loading) return <div className="text-muted-foreground">Cargando...</div>

  if (!week) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Financiero</h2>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No hay una semana activa.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalIncome = entries.filter((e) => e.type === "income").reduce((s, e) => s + Number(e.amount), 0)
  const totalExpenses = entries.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0)
  const netResult = totalIncome - totalExpenses
  const incomeTarget = target ? Number(target.income_target) : 0
  const expenseLimit = target ? Number(target.expense_limit) : 0
  const incomeProgress = incomeTarget > 0 ? Math.min(Math.round((totalIncome / incomeTarget) * 100), 100) : 0
  const expenseProgress = expenseLimit > 0 ? Math.min(Math.round((totalExpenses / expenseLimit) * 100), 100) : 0

  // Group by category
  const byCategory: Record<string, number> = {}
  entries.forEach((e) => {
    const key = `${e.type}:${e.category}`
    byCategory[key] = (byCategory[key] || 0) + Number(e.amount)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Financiero</h2>
        <Badge variant="outline">{week.start_date} — {week.end_date}</Badge>
      </div>

      {/* P&L Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm text-muted-foreground">Ingresos</span>
            </div>
            <p className="text-2xl font-bold text-success">${totalIncome.toLocaleString()}</p>
            {incomeTarget > 0 && (
              <>
                <Progress value={incomeProgress} className="mt-2 h-2" indicatorClassName="bg-success" />
                <p className="text-xs text-muted-foreground mt-1">{incomeProgress}% de ${incomeTarget.toLocaleString()}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-sm text-muted-foreground">Gastos</span>
            </div>
            <p className="text-2xl font-bold text-destructive">${totalExpenses.toLocaleString()}</p>
            {expenseLimit > 0 && (
              <>
                <Progress value={expenseProgress} className="mt-2 h-2" indicatorClassName={expenseProgress > 90 ? "bg-destructive" : "bg-warning"} />
                <p className="text-xs text-muted-foreground mt-1">{expenseProgress}% de ${expenseLimit.toLocaleString()}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <span className="text-sm text-muted-foreground">Resultado Neto</span>
            <p className={`text-2xl font-bold ${netResult >= 0 ? "text-success" : "text-destructive"}`}>
              ${netResult.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Entry */}
      {week.status !== "completed" && (
        <Card>
          <CardHeader>
            <CardTitle>Registrar Movimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <select
                value={entryType}
                onChange={(e) => {
                  setEntryType(e.target.value as "income" | "expense")
                  setEntryCategory("")
                }}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="income">Ingreso</option>
                <option value="expense">Gasto</option>
              </select>
              <Input
                type="number"
                placeholder="Monto"
                value={entryAmount}
                onChange={(e) => setEntryAmount(e.target.value)}
                className="w-32"
              />
              <select
                value={entryCategory}
                onChange={(e) => setEntryCategory(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="">Categoría</option>
                {categories[entryType].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <Input
                placeholder="Descripción (opcional)"
                value={entryDescription}
                onChange={(e) => setEntryDescription(e.target.value)}
                className="flex-1 min-w-[150px]"
              />
              <Input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-40"
              />
              <Button onClick={addEntry}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos</CardTitle>
          <CardDescription>{entries.length} registros esta semana</CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay movimientos registrados.</p>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {entry.type === "income" ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{entry.description || entry.category}</p>
                      <p className="text-xs text-muted-foreground">{entry.category} · {entry.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${entry.type === "income" ? "text-success" : "text-destructive"}`}>
                      {entry.type === "income" ? "+" : "-"}${Number(entry.amount).toLocaleString()}
                    </span>
                    {week.status !== "completed" && (
                      <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
