import { Trash2, PiggyBank, TrendingUp, TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/household";
import { formatBRL } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Form } from "@/components/ui/form";
import { StatCard } from "@/components/stat-card";
import { addInvestment, createInvestmentCategory, updateCurrentValue, deleteInvestment } from "./actions";

export default async function InvestimentosPage() {
  const member = await requireMember();
  const supabase = await createClient();

  const [{ data: investments }, { data: categories }] = await Promise.all([
    supabase
      .from("investments")
      .select("*, investment_categories(name)")
      .eq("household_id", member.household_id)
      .order("date", { ascending: false }),
    supabase
      .from("investment_categories")
      .select("*")
      .or(`is_system.eq.true,household_id.eq.${member.household_id}`)
      .order("name"),
  ]);

  const totalAplicado = (investments ?? []).reduce((sum, i) => sum + Number(i.amount_invested), 0);
  const totalAtual = (investments ?? []).reduce((sum, i) => sum + Number(i.current_value), 0);
  const rentabilidade = totalAplicado > 0 ? ((totalAtual - totalAplicado) / totalAplicado) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Investimentos</h1>
        <p className="text-sm text-muted-foreground">Acompanhe sua carteira de investimentos</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Aplicado" value={formatBRL(totalAplicado)} icon={PiggyBank} tone="primary" />
        <StatCard label="Valor Atual" value={formatBRL(totalAtual)} icon={PiggyBank} tone="success" />
        <StatCard
          label="Rentabilidade"
          value={`${rentabilidade >= 0 ? "+" : ""}${rentabilidade.toFixed(1)}%`}
          icon={rentabilidade >= 0 ? TrendingUp : TrendingDown}
          tone={rentabilidade >= 0 ? "success" : "danger"}
        />
      </div>

      <Card className="p-5">
        <Form action={addInvestment} className="grid grid-cols-1 gap-3 sm:grid-cols-6">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" placeholder="Ex: Tesouro Selic" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category_id">Categoria</Label>
            <Select id="category_id" name="category_id" required>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount_invested">Valor investido</Label>
            <Input id="amount_invested" name="amount_invested" type="number" step="0.01" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="current_value">Valor atual (opcional)</Label>
            <Input id="current_value" name="current_value" type="number" step="0.01" placeholder="= investido" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Data</Label>
            <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <SubmitButton className="sm:col-span-6">Adicionar investimento</SubmitButton>
        </Form>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-medium text-foreground">Nova categoria</h2>
        <Form action={createInvestmentCategory} className="mt-3 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="cat_name">Nome</Label>
            <Input id="cat_name" name="name" required placeholder="Ex: Cripto, Imóveis..." />
          </div>
          <SubmitButton variant="secondary" className="sm:self-end">
            Criar categoria
          </SubmitButton>
        </Form>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(investments ?? []).map((inv) => {
          const category = Array.isArray(inv.investment_categories)
            ? inv.investment_categories[0]
            : inv.investment_categories;
          const ganho = Number(inv.current_value) - Number(inv.amount_invested);
          const ganhoPct =
            Number(inv.amount_invested) > 0 ? (ganho / Number(inv.amount_invested)) * 100 : 0;
          return (
            <Card key={inv.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <PiggyBank size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{inv.name}</div>
                    <div className="text-xs text-muted-foreground">{category?.name ?? "—"}</div>
                  </div>
                </div>
                <form action={deleteInvestment.bind(null, inv.id)}>
                  <button
                    type="submit"
                    aria-label="Remover"
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-bg hover:text-danger"
                  >
                    <Trash2 size={14} />
                  </button>
                </form>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">Investido</div>
                  <div className="font-medium text-foreground">{formatBRL(Number(inv.amount_invested))}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Atual</div>
                  <div className="font-medium text-foreground">{formatBRL(Number(inv.current_value))}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Rendimento</div>
                  <div className={ganho >= 0 ? "font-medium text-success" : "font-medium text-danger"}>
                    {ganho >= 0 ? "+" : ""}
                    {ganhoPct.toFixed(1)}%
                  </div>
                </div>
              </div>

              <Form action={updateCurrentValue.bind(null, inv.id)} className="mt-4 flex gap-2">
                <div className="flex-1">
                  <Input
                    name="current_value"
                    type="number"
                    step="0.01"
                    placeholder="Novo valor atual"
                    defaultValue={inv.current_value}
                    required
                  />
                </div>
                <SubmitButton variant="secondary">Atualizar valor</SubmitButton>
              </Form>
            </Card>
          );
        })}
        {(investments ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground sm:col-span-2">Nenhum investimento cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}
