"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/household";
import type { FinancialGoalType } from "@/lib/types";

export async function createGoal(formData: FormData) {
  const { member } = await getCurrentMember();
  if (!member) return;

  const name = formData.get("name") as string;
  const type = formData.get("type") as FinancialGoalType;
  const targetAmount = Number(formData.get("target_amount"));
  const targetDate = (formData.get("target_date") as string) || null;
  const reserveMonths =
    type === "reserva_emergencia" ? Number(formData.get("reserve_months") || 6) : null;

  const supabase = await createClient();
  await supabase.from("financial_goals").insert({
    household_id: member.household_id,
    name,
    type,
    target_amount: targetAmount,
    target_date: targetDate,
    reserve_months: reserveMonths,
  });

  revalidatePath("/dashboard/metas");
}

export async function addContribution(formData: FormData) {
  const goalId = formData.get("goal_id") as string;
  const amount = Number(formData.get("amount"));
  const date = formData.get("date") as string;

  const supabase = await createClient();
  await supabase.from("goal_contributions").insert({ goal_id: goalId, amount, date });

  revalidatePath("/dashboard/metas");
  revalidatePath("/dashboard");
}

export async function deleteGoal(id: string) {
  const supabase = await createClient();
  await supabase.from("financial_goals").delete().eq("id", id);
  revalidatePath("/dashboard/metas");
}
