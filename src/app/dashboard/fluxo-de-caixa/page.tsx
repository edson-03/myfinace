import { ArrowDownCircle, ArrowUpCircle, Scale } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/household";
import { getMonthRange, formatBRL } from "@/lib/date";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";

export default async function FluxoDeCaixaPage() {
  const member = await requireMember();
  const supabase = await createClient();
  const { start, end } = getMonthRange();

  const [{ data: incomes }, { data: expenses }] = await Promise.all([
    supabase
      .from("incomes")
      .select("amount, date")
      .eq("household_id", member.household_id)
      .gte("date", start)
      .lte("date", end),
    supabase
      .from("expenses")
      .select("amount, date")
      .eq("household_id", member.household_id)
      .gte("date", start)
      .lte("date", end),
  ]);

  const byDay = new Map<string, { entradas: number; saidas: number }>();

  for (const income of incomes ?? []) {
    const day = byDay.get(income.date) ?? { entradas: 0, saidas: 0 };
    day.entradas += Number(income.amount);
    byDay.set(income.date, day);
  }

  for (const expense of expenses ?? []) {
    const day = byDay.get(expense.date) ?? { entradas: 0, saidas: 0 };
    day.saidas += Number(expense.amount);
    byDay.set(expense.date, day);
  }

  const days = Array.from(byDay.entries()).sort(([a], [b]) => a.localeCompare(b));

  let acumulado = 0;
  const rows = days.map(([date, { entradas, saidas }]) => {
    const saldoDia = entradas - saidas;
    acumulado += saldoDia;
    return { date, entradas, saidas, saldoDia, acumulado };
  });

  const chartData = rows.map((r) => ({
    date: r.date.slice(8, 10) + "/" + r.date.slice(5, 7),
    saldo: r.acumulado,
  }));

  const totalEntradas = rows.reduce((s, r) => s + r.entradas, 0);
  const totalSaidas = rows.reduce((s, r) => s + r.saidas, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Fluxo de Caixa</h1>
        <p className="text-sm text-muted-foreground">Movimentações do mês atual</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Entradas" value={formatBRL(totalEntradas)} icon={ArrowUpCircle} tone="success" />
        <StatCard label="Saídas" value={formatBRL(totalSaidas)} icon={ArrowDownCircle} tone="danger" />
        <StatCard
          label="Saldo do mês"
          value={formatBRL(totalEntradas - totalSaidas)}
          icon={Scale}
          tone={totalEntradas - totalSaidas >= 0 ? "success" : "danger"}
        />
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-medium text-muted-foreground">Saldo acumulado</h2>
        <div className="mt-2">
          <CashFlowChart data={chartData} />
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Entradas</th>
              <th className="px-4 py-3 font-medium">Saídas</th>
              <th className="px-4 py-3 font-medium">Saldo do dia</th>
              <th className="px-4 py-3 font-medium">Saldo acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.date} className="hover:bg-surface-hover">
                <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                <td className="px-4 py-3 text-success">{formatBRL(r.entradas)}</td>
                <td className="px-4 py-3 text-danger">{formatBRL(r.saidas)}</td>
                <td className="px-4 py-3">{formatBRL(r.saldoDia)}</td>
                <td className="px-4 py-3 font-medium text-foreground">{formatBRL(r.acumulado)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Sem movimentações neste mês.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
