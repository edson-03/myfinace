import Link from "next/link";
import { Trash2, Receipt, Pencil, CreditCard } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/household";
import { formatBRL, getMonthRange } from "@/lib/date";
import { buildCategoryOptions } from "@/lib/categories";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { addExpense, createCategory, toggleExpenseStatus, deleteExpense } from "./actions";
import type { ExpenseCategory } from "@/lib/types";

const GROUP_LABELS: Record<string, string> = {
  essencial: "Essencial",
  nao_essencial: "Não Essencial",
  divida: "Dívida",
};

const PAYMENT_LABELS: Record<string, string> = {
  debito: "Débito",
  credito: "Crédito",
};

export default async function DespesasPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const member = await requireMember();
  const supabase = await createClient();

  const { month: monthParam } = await searchParams;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const month = monthParam || currentMonth;
  const { start, end } = getMonthRange(new Date(`${month}-01T12:00:00`));

  const [{ data: categories }, { data: cards }, { data: expenses }] = await Promise.all([
    supabase
      .from("expense_categories")
      .select("*")
      .or(`is_system.eq.true,household_id.eq.${member.household_id}`),
    supabase
      .from("credit_cards")
      .select("id, bank")
      .eq("household_id", member.household_id)
      .order("bank"),
    supabase
      .from("expenses")
      .select(
        "id, description, amount, date, status, payment_method, installment_number, installment_total, expense_categories(name), credit_cards(bank)",
      )
      .eq("household_id", member.household_id)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false }),
  ]);

  const categoryOptions = buildCategoryOptions((categories ?? []) as ExpenseCategory[]);
  const topLevelCategories = ((categories ?? []) as ExpenseCategory[])
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.name.localeCompare(b.name));

  const monthTotal = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Despesas</h1>
        <p className="text-sm text-muted-foreground">Registre e acompanhe seus gastos</p>
      </div>

      <Card className="flex flex-wrap items-end justify-between gap-3 p-5">
        <form method="get" className="flex items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="month">Mês</Label>
            <Input id="month" name="month" type="month" defaultValue={month} />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-surface-hover px-4 py-2.5 text-sm font-medium text-foreground hover:bg-border"
          >
            Filtrar
          </button>
          {monthParam && (
            <Link
              href="/dashboard/despesas"
              className="px-2 py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Limpar
            </Link>
          )}
        </form>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Total no mês</div>
          <div className="text-lg font-semibold text-danger">{formatBRL(monthTotal)}</div>
        </div>
      </Card>

      <Card className="p-5">
        <Form action={addExpense} className="grid grid-cols-1 gap-3 sm:grid-cols-6">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="description">Descrição</Label>
            <Input id="description" name="description" required />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="category_id">Categoria</Label>
            <Select id="category_id" name="category_id" required>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
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
            <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payment_method">Forma de pagamento</Label>
            <Select id="payment_method" name="payment_method" defaultValue="">
              <option value="">Não informado</option>
              <option value="debito">Débito</option>
              <option value="credito">Crédito</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="card_id">Cartão (opcional)</Label>
            <Select id="card_id" name="card_id" defaultValue="">
              <option value="">Nenhum</option>
              {(cards ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.bank}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="installment_total">Parcelas</Label>
            <Input id="installment_total" name="installment_total" type="number" min={1} defaultValue={1} />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input name="is_recurring" type="checkbox" className="accent-[var(--primary)]" />
              Recorrente
            </label>
          </div>
          <SubmitButton className="sm:col-span-6">Adicionar despesa</SubmitButton>
        </Form>
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-medium text-foreground">Nova categoria</h2>
        <Form action={createCategory} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-5">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cat_name">Nome</Label>
            <Input id="cat_name" name="name" required placeholder="Ex: Pet, Cursos..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat_group">Grupo</Label>
            <Select id="cat_group" name="group" defaultValue="essencial">
              <option value="essencial">Essencial</option>
              <option value="nao_essencial">Não Essencial</option>
              <option value="divida">Dívida</option>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cat_parent">Categoria pai (opcional)</Label>
            <Select id="cat_parent" name="parent_id" defaultValue="">
              <option value="">Nenhuma (categoria própria)</option>
              {topLevelCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({GROUP_LABELS[c.group]})
                </option>
              ))}
            </Select>
          </div>
          <SubmitButton variant="secondary" className="sm:col-span-5">
            Criar categoria
          </SubmitButton>
        </Form>
        <p className="mt-2 text-xs text-muted-foreground">
          Se escolher uma categoria pai, o grupo (essencial/não essencial/dívida) é herdado dela.
        </p>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Pagamento</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(expenses ?? []).map((expense) => {
              const category = Array.isArray(expense.expense_categories)
                ? expense.expense_categories[0]
                : expense.expense_categories;
              const card = Array.isArray(expense.credit_cards)
                ? expense.credit_cards[0]
                : expense.credit_cards;
              return (
                <tr key={expense.id} className="hover:bg-surface-hover">
                  <td className="px-4 py-3 text-muted-foreground">{expense.date}</td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {expense.description}
                    {expense.installment_total && expense.installment_total > 1 && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({expense.installment_number}/{expense.installment_total})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{category?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1">
                      {expense.payment_method && (
                        <Badge tone="neutral">{PAYMENT_LABELS[expense.payment_method] ?? expense.payment_method}</Badge>
                      )}
                      {card?.bank && (
                        <Badge tone="neutral">
                          <CreditCard size={11} className="mr-1 inline" />
                          {card.bank}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-danger">- {formatBRL(Number(expense.amount))}</td>
                  <td className="px-4 py-3">
                    <form action={toggleExpenseStatus.bind(null, expense.id, expense.status)}>
                      <button type="submit">
                        <Badge tone={expense.status === "pago" ? "success" : "warning"}>
                          {expense.status}
                        </Badge>
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/despesas/${expense.id}/editar`}
                        aria-label="Editar"
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                      >
                        <Pencil size={14} />
                      </Link>
                      <form action={deleteExpense.bind(null, expense.id)}>
                        <button
                          type="submit"
                          aria-label="Remover"
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger-bg hover:text-danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(expenses ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  <Receipt className="mx-auto mb-2 opacity-40" size={24} />
                  Nenhuma despesa lançada neste mês.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
