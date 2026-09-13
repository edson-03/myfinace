import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/household";
import { buildCategoryOptions } from "@/lib/categories";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Form } from "@/components/ui/form";
import { updateExpense } from "../../actions";
import type { ExpenseCategory } from "@/lib/types";

export default async function EditarDespesaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await requireMember();
  const supabase = await createClient();

  const [{ data: expense }, { data: categories }, { data: cards }] = await Promise.all([
    supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .eq("household_id", member.household_id)
      .single(),
    supabase
      .from("expense_categories")
      .select("*")
      .or(`is_system.eq.true,household_id.eq.${member.household_id}`),
    supabase
      .from("credit_cards")
      .select("id, bank")
      .eq("household_id", member.household_id)
      .order("bank"),
  ]);

  if (!expense) {
    notFound();
  }

  const categoryOptions = buildCategoryOptions((categories ?? []) as ExpenseCategory[]);
  const updateExpenseWithId = updateExpense.bind(null, expense.id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/despesas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} /> Voltar
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Editar despesa</h1>
      </div>

      <Card className="max-w-2xl p-5">
        <Form action={updateExpenseWithId} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" name="description" required defaultValue={expense.description} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="category_id">Categoria</Label>
            <Select id="category_id" name="category_id" required defaultValue={expense.category_id}>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Valor</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              required
              defaultValue={expense.amount}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Data</Label>
            <Input id="date" name="date" type="date" required defaultValue={expense.date} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" required defaultValue={expense.status}>
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payment_method">Forma de pagamento</Label>
            <Select id="payment_method" name="payment_method" defaultValue={expense.payment_method ?? ""}>
              <option value="">Não informado</option>
              <option value="debito">Débito</option>
              <option value="credito">Crédito</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="card_id">Cartão (opcional)</Label>
            <Select id="card_id" name="card_id" defaultValue={expense.card_id ?? ""}>
              <option value="">Nenhum</option>
              {(cards ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.bank}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                name="is_recurring"
                type="checkbox"
                defaultChecked={expense.is_recurring}
                className="accent-[var(--primary)]"
              />
              Recorrente
            </label>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <SubmitButton>Salvar alterações</SubmitButton>
            <Link href="/dashboard/despesas">
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
