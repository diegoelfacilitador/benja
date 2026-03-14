"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import * as S from "@/lib/gestion/styles"

const categories = {
  income: ["Ventas", "Servicios", "Consultoría", "Otro ingreso"],
  expense: ["Herramientas", "Marketing", "Equipo", "Oficina", "Servicios", "Impuestos", "Otro gasto"],
}

export default function FinancieroPage() {
  const supabase = createClient()
  const [week, setWeek] = useState(null)
  const [entries, setEntries] = useState([])
  const [target, setTarget] = useState(null)
  const [loading, setLoading] = useState(true)

  const [entryType, setEntryType] = useState("income")
  const [entryAmount, setEntryAmount] = useState("")
  const [entryCategory, setEntryCategory] = useState("")
  const [entryDescription, setEntryDescription] = useState("")
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0])

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
      const [entriesRes, targetRes] = await Promise.all([
        supabase.from("gestion_financial_entries").select("*").eq("week_id", activeWeek.id).order("date", { ascending: false }),
        supabase.from("gestion_financial_targets").select("*").eq("week_id", activeWeek.id).single(),
      ])
      setEntries(entriesRes.data || [])
      if (targetRes.data) setTarget(targetRes.data)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadData() }, [loadData])

  async function addEntry() {
    if (!entryAmount || !entryCategory || !week) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("gestion_financial_entries")
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
      setEntries([data, ...entries])
      setEntryAmount("")
      setEntryDescription("")
    }
  }

  async function deleteEntry(id) {
    await supabase.from("gestion_financial_entries").delete().eq("id", id)
    setEntries(entries.filter((e) => e.id !== id))
  }

  if (loading) return <p style={{ color: S.colors.textSecondary }}>Cargando...</p>

  if (!week) {
    return (
      <div>
        <h2 style={S.pageTitle}>Financiero</h2>
        <div style={{ ...S.card, marginTop: 24 }}>
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ color: S.colors.textSecondary }}>No hay una semana activa.</p>
          </div>
        </div>
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

  return (
    <div style={S.spacingStack(24)}>
      <div style={S.flexBetween}>
        <h2 style={S.pageTitle}>Financiero</h2>
        <span style={S.badge('outline')}>{week.start_date} — {week.end_date}</span>
      </div>

      {/* P&L Summary */}
      <div style={S.grid(3, 16)}>
        <div style={S.card}>
          <div style={{ padding: 24 }}>
            <div style={{ ...S.flexGap(8), marginBottom: 4 }}>
              <span style={{ color: S.colors.success }}>↑</span>
              <span style={{ fontSize: 13, color: S.colors.textSecondary }}>Ingresos</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: S.colors.success, margin: 0 }}>
              ${totalIncome.toLocaleString()}
            </p>
            {incomeTarget > 0 && (
              <>
                <div style={{ ...S.progressBar, height: 6, marginTop: 8 }}>
                  <div style={S.progressIndicator(incomeProgress, S.colors.success)} />
                </div>
                <p style={{ fontSize: 11, color: S.colors.textSecondary, marginTop: 4 }}>
                  {incomeProgress}% de ${incomeTarget.toLocaleString()}
                </p>
              </>
            )}
          </div>
        </div>

        <div style={S.card}>
          <div style={{ padding: 24 }}>
            <div style={{ ...S.flexGap(8), marginBottom: 4 }}>
              <span style={{ color: S.colors.error }}>↓</span>
              <span style={{ fontSize: 13, color: S.colors.textSecondary }}>Gastos</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: S.colors.error, margin: 0 }}>
              ${totalExpenses.toLocaleString()}
            </p>
            {expenseLimit > 0 && (
              <>
                <div style={{ ...S.progressBar, height: 6, marginTop: 8 }}>
                  <div style={S.progressIndicator(expenseProgress, expenseProgress > 90 ? S.colors.error : S.colors.warning)} />
                </div>
                <p style={{ fontSize: 11, color: S.colors.textSecondary, marginTop: 4 }}>
                  {expenseProgress}% de ${expenseLimit.toLocaleString()}
                </p>
              </>
            )}
          </div>
        </div>

        <div style={S.card}>
          <div style={{ padding: 24 }}>
            <span style={{ fontSize: 13, color: S.colors.textSecondary }}>Resultado Neto</span>
            <p style={{
              fontSize: 22, fontWeight: 700, margin: '4px 0 0',
              color: netResult >= 0 ? S.colors.success : S.colors.error,
            }}>
              ${netResult.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Add Entry */}
      {week.status !== "completed" && (
        <div style={S.card}>
          <div style={S.cardHeader}>
            <h3 style={S.cardTitleLarge}>Registrar Movimiento</h3>
          </div>
          <div style={S.cardContent}>
            <div style={{ ...S.flexGap(8), flexWrap: 'wrap' }}>
              <select
                style={{ ...S.select, width: 'auto' }}
                value={entryType}
                onChange={(e) => { setEntryType(e.target.value); setEntryCategory("") }}
              >
                <option value="income">Ingreso</option>
                <option value="expense">Gasto</option>
              </select>
              <input type="number" style={{ ...S.input, width: 120 }} placeholder="Monto" value={entryAmount} onChange={(e) => setEntryAmount(e.target.value)} />
              <select style={{ ...S.select, width: 'auto' }} value={entryCategory} onChange={(e) => setEntryCategory(e.target.value)}>
                <option value="">Categoría</option>
                {categories[entryType].map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input style={{ ...S.input, flex: 1, minWidth: 150 }} placeholder="Descripción (opcional)" value={entryDescription} onChange={(e) => setEntryDescription(e.target.value)} />
              <input type="date" style={{ ...S.input, width: 160 }} value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
              <button style={S.buttonPrimary} onClick={addEntry}>+</button>
            </div>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <h3 style={S.cardTitleLarge}>Movimientos</h3>
          <p style={S.cardDescription}>{entries.length} registros esta semana</p>
        </div>
        <div style={S.cardContent}>
          {entries.length === 0 ? (
            <p style={{ fontSize: 13, color: S.colors.textSecondary, textAlign: 'center', padding: 16 }}>
              No hay movimientos registrados.
            </p>
          ) : (
            <div style={S.spacingStack(8)}>
              {entries.map((entry) => (
                <div key={entry.id} style={S.listItem}>
                  <div style={S.flexGap(12)}>
                    <span style={{ color: entry.type === "income" ? S.colors.success : S.colors.error }}>
                      {entry.type === "income" ? "↑" : "↓"}
                    </span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{entry.description || entry.category}</p>
                      <p style={{ fontSize: 11, color: S.colors.textSecondary, margin: 0 }}>{entry.category} · {entry.date}</p>
                    </div>
                  </div>
                  <div style={S.flexGap(12)}>
                    <span style={{
                      fontSize: 13, fontWeight: 600,
                      color: entry.type === "income" ? S.colors.success : S.colors.error,
                    }}>
                      {entry.type === "income" ? "+" : "-"}${Number(entry.amount).toLocaleString()}
                    </span>
                    {week.status !== "completed" && (
                      <button style={S.buttonGhost} onClick={() => deleteEntry(entry.id)}>🗑</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
