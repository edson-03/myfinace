"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/household";

export async function addExpense(formData: FormData) {
  const { member } = await getCurrentMember();
  if (!member) return;

  const categoryId = formData.get("category_id") as string;
  const description = formData.get("description") as string;
  const amount = Number(formData.get("amount"));
  const date = formData.get("date") as string;
  const isRecurring = formData.get("is_recurring") === "on";
  const installmentTotal = Number(formData.get("installment_total") || 1);
  const paymentMethod = (formData.get("payment_method") as string) || null;
  const cardId = (formData.get("card_id") as string) || null;

  const supabase = await createClient();

  if (installmentTotal > 1) {
    const groupId = crypto.randomUUID();
    const baseDate = new Date(date);
    const rows = Array.from({ length: installmentTotal }, (_, i) => {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + i);
      return {
        household_id: member.household_id,
        category_id: categoryId,
        member_id: member.id,
        description,
        amount,
        date: d.toISOString().slice(0, 10),
        status: "pendente" as const,
        installment_group_id: groupId,
        installment_number: i + 1,
        installment_total: installmentTotal,
        payment_method: paymentMethod,
        card_id: cardId,
      };
    });
    await supabase.from("expenses").insert(rows);
  } else {
    await supabase.from("expenses").insert({
      household_id: member.household_id,
      category_id: categoryId,
      member_id: member.id,
      description,
      amount,
      date,
      status: "pendente",
      is_recurring: isRecurring,
      payment_method: paymentMethod,
      card_id: cardId,
    });
  }

  revalidatePath("/dashboard/despesas");
  revalidatePath("/dashboard");
}

export async function createCategory(formData: FormData) {
  const { member } = await getCurrentMember();
  if (!member) return;

  const name = formData.get("name") as string;
  const parentId = (formData.get("parent_id") as string) || null;
  let group = formData.get("group") as string;

  const supabase = await createClient();

  if (parentId) {
    const { data: parent } = await supabase
      .from("expense_categories")
      .select("group")
      .eq("id", parentId)
      .single();
    if (parent) group = parent.group;
  }

  await supabase.from("expense_categories").insert({
    household_id: member.household_id,
    parent_id: parentId,
    name,
    group,
    is_system: false,
  });

  revalidatePath("/dashboard/despesas");
}

export async function updateExpense(id: string, formData: FormData) {
  const categoryId = formData.get("category_id") as string;
  const description = formData.get("description") as string;
  const amount = Number(formData.get("amount"));
  const date = formData.get("date") as string;
  const status = formData.get("status") as string;
  const isRecurring = formData.get("is_recurring") === "on";
  const paymentMethod = (formData.get("payment_method") as string) || null;
  const cardId = (formData.get("card_id") as string) || null;

  const supabase = await createClient();
  await supabase
    .from("expenses")
    .update({
      category_id: categoryId,
      description,
      amount,
      date,
      status,
      is_recurring: isRecurring,
      payment_method: paymentMethod,
      card_id: cardId,
    })
    .eq("id", id);

  revalidatePath("/dashboard/despesas");
  revalidatePath("/dashboard");
  redirect("/dashboard/despesas");
}

export async function toggleExpenseStatus(id: string, currentStatus: string) {
  const supabase = await createClient();
  await supabase
    .from("expenses")
    .update({ status: currentStatus === "pago" ? "pendente" : "pago" })
    .eq("id", id);
  revalidatePath("/dashboard/despesas");
  revalidatePath("/dashboard");
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  await supabase.from("expenses").delete().eq("id", id);
  revalidatePath("/dashboard/despesas");
  revalidatePath("/dashboard");
}
