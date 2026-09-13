"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/household";

export async function addCard(formData: FormData) {
  const member = await requireMember();

  const bank = formData.get("bank") as string;
  const creditLimit = Number(formData.get("credit_limit"));
  const closingDay = Number(formData.get("closing_day"));
  const dueDay = Number(formData.get("due_day"));

  const supabase = await createClient();
  await supabase.from("credit_cards").insert({
    household_id: member.household_id,
    bank,
    credit_limit: creditLimit,
    closing_day: closingDay,
    due_day: dueDay,
  });

  revalidatePath("/dashboard/cartoes");
}

export async function deleteCard(id: string) {
  const supabase = await createClient();
  await supabase.from("credit_cards").delete().eq("id", id);
  revalidatePath("/dashboard/cartoes");
}
