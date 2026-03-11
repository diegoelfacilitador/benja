import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FinancialEntry, FinancialTarget } from "@/types"

export function DashboardFinancial({
  entries,
  target,
}: {
  entries: FinancialEntry[]
  target: FinancialTarget | null
}) {
  const income = entries.filter((e) => e.type === "income").reduce((sum, e) => sum + Number(e.amount), 0)
  const expenses = entries.filter((e) => e.type === "expense").reduce((sum, e) => sum + Number(e.amount), 0)

  const recentEntries = [...entries]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Resumen Financiero</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Ingresos</p>
            <p className="text-lg font-semibold text-success">${income.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Gastos</p>
            <p className="text-lg font-semibold text-destructive">${expenses.toLocaleString()}</p>
          </div>
        </div>

        {recentEntries.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Últimos movimientos</p>
            {recentEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{entry.description || entry.category}</span>
                <span className={entry.type === "income" ? "text-success" : "text-destructive"}>
                  {entry.type === "income" ? "+" : "-"}${Number(entry.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
