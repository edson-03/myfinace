import { Trash2, Target, ShieldCheck, Plane, Home, Car, PiggyBank } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/household";
import { formatBRL, getMonthRange } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Form } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { createGoal, addContribution, deleteGoal } from "./actions";

const TYPE_LABELS: Record<string, string> = {
  reserva_emergencia: "Reserva de Emergência",
  viagem: "Viagem",
  casa_propria: "Casa Própria",
  carro: "Carro",
  aposentadoria: "Aposentadoria",
  outro: "Outro",
};

const TYPE_ICONS: Record<string, LucideIcon> = {
  reserva_emergencia: ShieldCheck,
  viagem: Plane,
  casa_propria: Home,
  carro: Car,
  aposentadoria: PiggyBank,
  outro: Target,
};

export default async function MetasPage() {
  const member = await requireMember();
  const supabase = await createClient();

  const [{ data: goals }, { start, end }] = [
    await supabase
      .from("financial_goals")
      .select("id, name, type, target_amount, target_date, reserve_months, goal_contributions(amount)")
      .eq("household_id", member.household_id)
      .order("priority", { ascending: true }),
    getMonthRange(),
  ];

  const { data: essentialExpenses } = await supabase
    .from("expenses")
    .select("amount, expense_categories!inner(group)")
    .eq("household_id", member.household_id)
    .eq("expense_categories.group", "essencial")
    .gte("date", start)
    .lte("date", end);

  const despesaEssencialMes = (essentialExpenses ?? []).reduce(
    (sum, e) => sum + Number(e.amount),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Planejamento Financeiro</h1>
        <p className="text-sm text-muted-foreground">Defina e acompanhe suas metas</p>
      </div>

      <Card className="p-5">
        <Form action={createGoal} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Nome da meta</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Tipo</Label>
            <Select id="type" name="type" required>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="target_amount">Valor alvo</Label>
            <Input id="target_amount" name="target_amount" type="number" step="0.01" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="target_date">Prazo</Label>
            <Input id="target_date" name="target_date" type="date" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="reserve_months">Meses de reserva (só p/ Reserva de Emergência)</Label>
            <Select id="reserve_months" name="reserve_months" defaultValue={6}>
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
            </Select>
          </div>
          <SubmitButton className="self-end sm:col-span-3">Criar meta</SubmitButton>
        </Form>

        {despesaEssencialMes > 0 && (
          <p className="mt-3 text-xs text-muted-foreground">
            Sugestão com base nas despesas essenciais deste mês ({formatBRL(despesaEssencialMes)}): 3 meses ={" "}
            {formatBRL(despesaEssencialMes * 3)} · 6 meses = {formatBRL(despesaEssencialMes * 6)} · 12 meses ={" "}
            {formatBRL(despesaEssencialMes * 12)}
          </p>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(goals ?? []).map((goal) => {
          const atual = (goal.goal_contributions ?? []).reduce(
            (sum: number, c: { amount: number }) => sum + Number(c.amount),
            0,
          );
          const pct = Math.min(100, (atual / Number(goal.target_amount)) * 100);
          const Icon = TYPE_ICONS[goal.type] ?? Target;

          return (
            <Card key={goal.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{goal.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {TYPE_LABELS[goal.type]}
                      {goal.type === "reserva_emergencia" && goal.reserve_months
                        ? ` · ${goal.reserve_months} meses`
                        : ""}
                    </div>
                  </div>
                </div>
                <form action={deleteGoal.bind(null, goal.id)}>
                  <button
                    type="submit"
                    aria-label="Remover"
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>

              <Progress value={pct} className="mt-4" />
              <div className="mt-1.5 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{formatBRL(atual)}</span> de{" "}
                {formatBRL(Number(goal.target_amount))} ({pct.toFixed(0)}%)
              </div>

              <Form action={addContribution} className="mt-4 flex gap-2">
                <input type="hidden" name="goal_id" value={goal.id} />
                <div className="flex-1">
                  <Input name="amount" type="number" step="0.01" placeholder="Valor do aporte" required />
                </div>
                <div className="w-40 shrink-0">
                  <Input
                    name="date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <SubmitButton variant="secondary">Aportar</SubmitButton>
              </Form>
            </Card>
          );
        })}
        {(goals ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground sm:col-span-2">Nenhuma meta criada ainda.</p>
        )}
      </div>
    </div>
  );
}
