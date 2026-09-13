import { Wallet, TrendingDown, TrendingUp, PiggyBank, LineChart, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/household";
import { getMonthRange, formatBRL } from "@/lib/date";
import { calcHealthScore, scoreLabel } from "@/lib/indicators";
import { StatCard } from "@/components/stat-card";
import { Card } from "@/components/ui/card";
import { ScoreGauge } from "@/components/score-gauge";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { ExpenseDonut } from "@/components/charts/expense-donut";

export default async function DashboardPage() {
  const member = await requireMember();
  const supabase = await createClient();
  const { start, end } = getMonthRange();

  const householdId = member.household_id;

  const [incomesRes, expensesRes, investmentsRes, goalsRes, debtsRes] = await Promise.all([
    supabase
      .from("incomes")
      .select("amount, date, is_projected")
      .eq("household_id", householdId)
      .gte("date", start)
      .lte("date", end),
    supabase
      .from("expenses")
      .select("amount, date, status, expense_categories(name, group)")
      .eq("household_id", householdId)
      .gte("date", start)
      .lte("date", end),
    supabase
      .from("investments")
      .select("amount_invested, current_value")
      .eq("household_id", householdId),
    supabase
      .from("financial_goals")
      .select("id, target_amount, reserve_months, goal_contributions(amount)")
      .eq("household_id", householdId)
      .eq("type", "reserva_emergencia"),
    supabase.from("debts").select("remaining_amount").eq("household_id", householdId),
  ]);

  const incomes = incomesRes.data ?? [];
  const expenses = expensesRes.data ?? [];
  const investments = investmentsRes.data ?? [];
  const goals = goalsRes.data ?? [];
  const debts = debtsRes.data ?? [];

  const receitaRealizada = incomes
    .filter((i) => !i.is_projected)
    .reduce((sum, i) => sum + Number(i.amount), 0);
  const receitaTotal = incomes.reduce((sum, i) => sum + Number(i.amount), 0);

  const despesaPaga = expenses
    .filter((e) => e.status === "pago")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const despesaTotal = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const saldoAtual = receitaRealizada - despesaPaga;
  const saldoProjetado = receitaTotal - despesaTotal;

  const totalInvestidoAtual = investments.reduce((sum, i) => sum + Number(i.current_value), 0);
  const totalAplicado = investments.reduce((sum, i) => sum + Number(i.amount_invested), 0);

  const reserva = goals[0];
  const reservaAtual =
    reserva?.goal_contributions?.reduce(
      (sum: number, c: { amount: number }) => sum + Number(c.amount),
      0,
    ) ?? 0;
  const reservaMeta = reserva ? Number(reserva.target_amount) : 0;

  function categoryOf(e: (typeof expenses)[number]) {
    return Array.isArray(e.expense_categories) ? e.expense_categories[0] : e.expense_categories;
  }

  const despesaEssencialMes = expenses
    .filter((e) => categoryOf(e)?.group === "essencial")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const reservaIdeal = despesaEssencialMes * (reserva?.reserve_months ?? 6);

  const totalDividas = debts.reduce((sum, d) => sum + Number(d.remaining_amount), 0);

  const taxaPoupanca = receitaTotal > 0 ? (receitaTotal - despesaTotal) / receitaTotal : 0;
  const indiceEndividamento = receitaTotal > 0 ? totalDividas / receitaTotal : 0;
  const percentualInvestido = receitaTotal > 0 ? totalInvestidoAtual / receitaTotal : 0;

  const health = calcHealthScore({
    taxaPoupanca,
    indiceEndividamento,
    percentualInvestido,
    reservaAtual,
    reservaIdeal,
    totalAplicado,
    totalAtualInvestido: totalInvestidoAtual,
  });

  const byDay = new Map<string, number>();
  for (const i of incomes) byDay.set(i.date, (byDay.get(i.date) ?? 0) + Number(i.amount));
  for (const e of expenses) byDay.set(e.date, (byDay.get(e.date) ?? 0) - Number(e.amount));
  let acumulado = 0;
  const cashFlowData = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, delta]) => {
      acumulado += delta;
      return { date: date.slice(8, 10) + "/" + date.slice(5, 7), saldo: acumulado };
    });

  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    const name = categoryOf(e)?.name ?? "Outros";
    byCategory.set(name, (byCategory.get(name) ?? 0) + Number(e.amount));
  }
  const expenseBreakdown = Array.from(byCategory.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Resumo financeiro do mês atual</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Receita Total (mês)" value={formatBRL(receitaTotal)} icon={TrendingUp} tone="success" />
        <StatCard label="Despesa Total (mês)" value={formatBRL(despesaTotal)} icon={TrendingDown} tone="danger" />
        <StatCard
          label="Saldo Atual"
          value={formatBRL(saldoAtual)}
          hint="receitas e despesas já realizadas"
          icon={Wallet}
          tone={saldoAtual >= 0 ? "success" : "danger"}
        />
        <StatCard
          label="Saldo Projetado"
          value={formatBRL(saldoProjetado)}
          hint="inclui pendentes e projetados"
          icon={LineChart}
          tone="primary"
        />
        <StatCard label="Investimentos" value={formatBRL(totalInvestidoAtual)} icon={PiggyBank} tone="primary" />
        <StatCard
          label="Reserva de Emergência"
          value={reserva ? `${formatBRL(reservaAtual)} / ${formatBRL(reservaMeta)}` : "sem meta definida"}
          hint={`ideal: ${formatBRL(reservaIdeal)} (${reserva?.reserve_months ?? 6} meses de essenciais)`}
          icon={ShieldCheck}
          tone="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-medium text-muted-foreground">Fluxo de caixa acumulado (mês)</h2>
          <div className="mt-2">
            <CashFlowChart data={cashFlowData} />
          </div>
        </Card>
        <Card className="flex flex-col items-center justify-center gap-4 p-5">
          <h2 className="self-start text-sm font-medium text-muted-foreground">Score de Saúde Financeira</h2>
          <ScoreGauge score={health.score} label={scoreLabel(health.score)} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-medium text-muted-foreground">Despesas por categoria (mês)</h2>
          <div className="mt-2">
            <ExpenseDonut data={expenseBreakdown} />
          </div>
        </Card>
        <div className="grid grid-cols-1 gap-4">
          <StatCard label="Taxa de Poupança" value={`${(taxaPoupanca * 100).toFixed(0)}%`} tone="success" />
          <StatCard
            label="Índice de Endividamento"
            value={`${(indiceEndividamento * 100).toFixed(0)}%`}
            hint="dívidas / receita"
            tone="danger"
          />
          <StatCard
            label="% Investido"
            value={`${(percentualInvestido * 100).toFixed(0)}%`}
            hint="investimentos / receita"
            tone="primary"
          />
        </div>
      </div>
    </div>
  );
}
