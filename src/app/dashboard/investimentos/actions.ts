"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/household";

export async function addInvestment(formData: FormData) {
  const member = await requireMember();

  const name = formData.get("name") as string;
  const categoryId = formData.get("category_id") as string;
  const amountInvested = Number(formData.get("amount_invested"));
  const currentValueRaw = formData.get("current_value") as string;
  const currentValue = currentValueRaw ? Number(currentValueRaw) : amountInvested;
  const date = formData.get("date") as string;

  const supabase = await createClient();
  await supabase.from("investments").insert({
    household_id: member.household_id,
    name,
    category_id: categoryId,
    amount_invested: amountInvested,
    current_value: currentValue,
    date,
  });

  revalidatePath("/dashboard/investimentos");
  revalidatePath("/dashboard");
}

export async function createInvestmentCategory(formData: FormData) {
  const member = await requireMember();
  const name = formData.get("name") as string;

  const supabase = await createClient();
  await supabase.from("investment_categories").insert({
    household_id: member.household_id,
    name,
    is_system: false,
  });

  revalidatePath("/dashboard/investimentos");
}

export async function updateCurrentValue(id: string, formData: FormData) {
  const currentValue = Number(formData.get("current_value"));

  const supabase = await createClient();
  await supabase.from("investments").update({ current_value: currentValue }).eq("id", id);

  revalidatePath("/dashboard/investimentos");
  revalidatePath("/dashboard");
}

export async function deleteInvestment(id: string) {
  const supabase = await createClient();
  await supabase.from("investments").delete().eq("id", id);
  revalidatePath("/dashboard/investimentos");
  revalidatePath("/dashboard");
}
