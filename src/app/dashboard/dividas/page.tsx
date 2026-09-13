import { Trash2, HandCoins } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/household";
import { formatBRL } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Form } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { createDebt, payInstallment, payCustomAmount, deleteDebt } from "./actions";

const TYPE_LABELS: Record<string, string> = {
  emprestimo: "Empréstimo",
  financiamento: "Financiamento",
  cartao_credito: "Cartão de Crédito",
};

export default async function DividasPage() {
  const member = await requireMember();
  const supabase = await createClient();

  const [{ data: debts }, { data: debtExpenses }] = await Promise.all([
    supabase
      .from("debts")
      .select("*")
      .eq("household_id", member.household_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("expenses")
      .select("debt_id")
      .eq("household_id", member.household_id)
      .not("debt_id", "is", null),
  ]);

  const paidCountByDebt = new Map<string, number>();
  for (const e of debtExpenses ?? []) {
    paidCountByDebt.set(e.debt_id as string, (paidCountByDebt.get(e.debt_id as string) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dívidas</h1>
        <p className="text-sm text-muted-foreground">Empréstimos, financiamentos e faturas</p>
      </div>

      <Card className="p-5">
        <Form action={createDebt} className="grid grid-cols-1 gap-3 sm:grid-cols-6">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">Credor / descrição</Label>
            <Input id="description" name="description" required />
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
            <Label htmlFor="total_amount">Saldo devedor</Label>
            <Input id="total_amount" name="total_amount" type="number" step="0.01" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="installment_amount">Valor da parcela</Label>
            <Input id="installment_amount" name="installment_amount" type="number" step="0.01" placeholder="deixe em branco se não negociada" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="installment_total">Quantidade de parcelas</Label>
            <Input id="installment_total" name="installment_total" type="number" min={1} placeholder="Ex: 12" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="interest_rate">Juros % (opcional)</Label>
            <Input id="interest_rate" name="interest_rate" type="number" step="0.01" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="due_day">Dia vencimento</Label>
            <Input id="due_day" name="due_day" type="number" min={1} max={31} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="start_date">Início</Label>
            <Input id="start_date" name="start_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input name="negotiated" type="checkbox" defaultChecked className="accent-[var(--primary)]" />
              Já negociada (tem parcela fixa)
            </label>
          </div>
          <SubmitButton className="self-end">Adicionar dívida</SubmitButton>
        </Form>
        <p className="mt-2 text-xs text-muted-foreground">
          Desmarque "Já negociada" para uma dívida ainda em aberto e sem parcelas definidas (ex: fatura de
          cartão de crédito que ainda não foi parcelada) — nesse caso deixe o valor da parcela e a
          quantidade em branco.
        </p>
      </Card>

      <div className="space-y-4">
        {(debts ?? []).map((debt) => {
          const pago = Number(debt.total_amount) - Number(debt.remaining_amount);
          const pct = Math.min(100, (pago / Number(debt.total_amount)) * 100);
          const paidCount = paidCountByDebt.get(debt.id) ?? 0;
          return (
            <Card key={debt.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-danger-bg text-danger">
                    <HandCoins size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{debt.description}</span>
                      {!debt.negotiated && <Badge tone="warning">Não negociada</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {TYPE_LABELS[debt.type]} · vence dia {debt.due_day}
                      {debt.negotiated && debt.installment_amount
                        ? ` · parcela ${formatBRL(Number(debt.installment_amount))}`
                        : ""}
                      {debt.installment_total ? ` (${paidCount}/${debt.installment_total} pagas)` : ""}
                      {debt.interest_rate ? ` · ${debt.interest_rate}% juros` : ""}
                    </div>
                  </div>
                </div>
                <form action={deleteDebt.bind(null, debt.id)}>
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
                <span className="font-medium text-foreground">{formatBRL(Number(debt.remaining_amount))}</span>{" "}
                restante de {formatBRL(Number(debt.total_amount))}
              </div>

              {debt.remaining_amount > 0 &&
                (debt.negotiated && debt.installment_amount ? (
                  <form action={payInstallment.bind(null, debt.id)} className="mt-3 flex justify-end">
                    <SubmitButton variant="secondary">Registrar pagamento de parcela</SubmitButton>
                  </form>
                ) : (
                  <Form action={payCustomAmount.bind(null, debt.id)} className="mt-3 flex gap-2">
                    <div className="flex-1">
                      <Input name="amount" type="number" step="0.01" placeholder="Valor do pagamento" required />
                    </div>
                    <SubmitButton variant="secondary">Registrar pagamento</SubmitButton>
                  </Form>
                ))}
            </Card>
          );
        })}
        {(debts ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma dívida cadastrada ainda.</p>
        )}
      </div>
    </div>
  );
}
