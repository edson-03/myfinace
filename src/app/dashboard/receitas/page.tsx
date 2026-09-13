import { Trash2, Wallet, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/household";
import { formatBRL } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Form } from "@/components/ui/form";
import { StatCard } from "@/components/stat-card";
import { addIncome, deleteIncome } from "./actions";

const TYPE_LABELS: Record<string, string> = {
  salario_liquido: "Salário Líquido",
  vale_alimentacao: "Vale Alimentação",
  vale_refeicao: "Vale Refeição",
  salario_outro_membro: "Salário de outro membro",
  comissao: "Comissão",
  bonus: "Bônus",
  freelance: "Freelance",
  uber: "Uber",
  vendas: "Vendas",
  aluguel: "Aluguel recebido",
  outra: "Outra renda",
};

export default async function ReceitasPage() {
  const member = await requireMember();
  const supabase = await createClient();

  const [{ data: incomes }, { data: allIncomes }, { data: allExpenses }] = await Promise.all([
    supabase
      .from("incomes")
      .select("id, amount, date, is_projected, income_sources(name, type)")
      .eq("household_id", member.household_id)
      .order("date", { ascending: false })
      .limit(50),
    supabase.from("incomes").select("amount").eq("household_id", member.household_id),
    supabase.from("expenses").select("amount").eq("household_id", member.household_id),
  ]);

  const totalReceitas = (allIncomes ?? []).reduce((sum, i) => sum + Number(i.amount), 0);
  const totalDespesas = (allExpenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
  const saldoAtual = totalReceitas - totalDespesas;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Receitas</h1>
        <p className="text-sm text-muted-foreground">Gerencie suas fontes de renda</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total de Receitas" value={formatBRL(totalReceitas)} icon={TrendingUp} tone="success" />
        <StatCard label="Total de Despesas" value={formatBRL(totalDespesas)} icon={TrendingDown} tone="danger" />
        <StatCard
          label="Saldo Atual"
          value={formatBRL(saldoAtual)}
          hint="depois de pagar todas as despesas"
          icon={Scale}
          tone={saldoAtual >= 0 ? "success" : "danger"}
        />
      </div>

      <Card className="p-5">
        <Form action={addIncome} className="grid grid-cols-1 gap-3 sm:grid-cols-6">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="source_name">Fonte</Label>
            <Input id="source_name" name="source_name" placeholder="Ex: Salário" required />
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
            <Label htmlFor="amount">Valor</Label>
            <Input id="amount" name="amount" type="number" step="0.01" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <div className="flex items-end justify-between gap-2 sm:col-span-1">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input name="is_recurring" type="checkbox" className="accent-[var(--primary)]" />
              Recorrente
            </label>
          </div>
          <SubmitButton className="sm:col-span-6">Adicionar receita</SubmitButton>
        </Form>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Fonte</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(incomes ?? []).map((income) => {
              const source = Array.isArray(income.income_sources)
                ? income.income_sources[0]
                : income.income_sources;
              return (
                <tr key={income.id} className="hover:bg-surface-hover">
                  <td className="px-4 py-3 text-muted-foreground">{income.date}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{source?.name ?? "—"}</td>
                  <td className="px-4 py-3 font-medium text-success">
                    + {formatBRL(Number(income.amount))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteIncome.bind(null, income.id)}>
                      <button
                        type="submit"
                        aria-label="Remover"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-bg hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {(incomes ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  <Wallet className="mx-auto mb-2 opacity-40" size={24} />
                  Nenhuma receita lançada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
