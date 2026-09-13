"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/household";
import type { DebtType } from "@/lib/types";

const DEBT_CATEGORY_NAME: Record<DebtType, string> = {
  emprestimo: "Empréstimos",
  financiamento: "Financiamentos",
  cartao_credito: "Cartão de Crédito",
};

export async function createDebt(formData: FormData) {
  const member = await requireMember();

  const type = formData.get("type") as DebtType;
  const description = formData.get("description") as string;
  const totalAmount = Number(formData.get("total_amount"));
  const interestRate = formData.get("interest_rate")
    ? Number(formData.get("interest_rate"))
    : null;
  const negotiated = formData.get("negotiated") === "on";
  const installmentAmount = formData.get("installment_amount")
    ? Number(formData.get("installment_amount"))
    : null;
  const installmentTotal = formData.get("installment_total")
    ? Number(formData.get("installment_total"))
    : null;
  const dueDay = Number(formData.get("due_day"));
  const startDate = formData.get("start_date") as string;

  const supabase = await createClient();

  const { data: category } = await supabase
    .from("expense_categories")
    .select("id")
    .eq("name", DEBT_CATEGORY_NAME[type])
    .eq("is_system", true)
    .single();

  if (!category) return;

  await supabase.from("debts").insert({
    household_id: member.household_id,
    category_id: category.id,
    type,
    description,
    total_amount: totalAmount,
    remaining_amount: totalAmount,
    interest_rate: interestRate,
    installment_amount: installmentAmount,
    installment_total: negotiated ? installmentTotal : null,
    negotiated,
    due_day: dueDay,
    start_date: startDate,
  });

  revalidatePath("/dashboard/dividas");
}

export async function payInstallment(debtId: string) {
  const member = await requireMember();
  const supabase = await createClient();

  const { data: debt } = await supabase
    .from("debts")
    .select("*")
    .eq("id", debtId)
    .single();

  if (!debt || !debt.installment_amount) return;

  const newRemaining = Math.max(0, Number(debt.remaining_amount) - Number(debt.installment_amount));

  await supabase.from("expenses").insert({
    household_id: member.household_id,
    category_id: debt.category_id,
    member_id: member.id,
    description: `Parcela - ${debt.description}`,
    amount: debt.installment_amount,
    date: new Date().toISOString().slice(0, 10),
    status: "pago",
    debt_id: debt.id,
  });

  await supabase.from("debts").update({ remaining_amount: newRemaining }).eq("id", debtId);

  revalidatePath("/dashboard/dividas");
  revalidatePath("/dashboard/despesas");
  revalidatePath("/dashboard");
}

export async function payCustomAmount(debtId: string, formData: FormData) {
  const member = await requireMember();
  const amount = Number(formData.get("amount"));
  const supabase = await createClient();

  const { data: debt } = await supabase.from("debts").select("*").eq("id", debtId).single();
  if (!debt) return;

  const newRemaining = Math.max(0, Number(debt.remaining_amount) - amount);

  await supabase.from("expenses").insert({
    household_id: member.household_id,
    category_id: debt.category_id,
    member_id: member.id,
    description: `Pagamento - ${debt.description}`,
    amount,
    date: new Date().toISOString().slice(0, 10),
    status: "pago",
    debt_id: debt.id,
  });

  await supabase.from("debts").update({ remaining_amount: newRemaining }).eq("id", debtId);

  revalidatePath("/dashboard/dividas");
  revalidatePath("/dashboard/despesas");
  revalidatePath("/dashboard");
}

export async function deleteDebt(id: string) {
  const supabase = await createClient();
  await supabase.from("debts").delete().eq("id", id);
  revalidatePath("/dashboard/dividas");
}
