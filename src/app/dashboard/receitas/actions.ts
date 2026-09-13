"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMember } from "@/lib/household";
import type { IncomeSourceType } from "@/lib/types";

export async function addIncome(formData: FormData) {
  const { member } = await getCurrentMember();
  if (!member) return;

  const sourceName = formData.get("source_name") as string;
  const type = formData.get("type") as IncomeSourceType;
  const amount = Number(formData.get("amount"));
  const date = formData.get("date") as string;
  const isRecurring = formData.get("is_recurring") === "on";

  const supabase = await createClient();

  let { data: source } = await supabase
    .from("income_sources")
    .select("id")
    .eq("household_id", member.household_id)
    .eq("name", sourceName)
    .maybeSingle();

  if (!source) {
    const { data: newSource, error } = await supabase
      .from("income_sources")
      .insert({
        household_id: member.household_id,
        member_id: member.id,
        name: sourceName,
        type,
        kind: ["salario_liquido", "vale_alimentacao", "vale_refeicao"].includes(type)
          ? "principal"
          : "secundaria",
        is_recurring: isRecurring,
        default_amount: amount,
      })
      .select("id")
      .single();

    if (error) return;
    source = newSource;
  }

  await supabase.from("incomes").insert({
    household_id: member.household_id,
    income_source_id: source!.id,
    amount,
    date,
    is_projected: false,
  });

  revalidatePath("/dashboard/receitas");
  revalidatePath("/dashboard");
}

export async function deleteIncome(id: string) {
  const supabase = await createClient();
  await supabase.from("incomes").delete().eq("id", id);
  revalidatePath("/dashboard/receitas");
  revalidatePath("/dashboard");
}
