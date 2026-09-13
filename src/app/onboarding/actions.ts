"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createHousehold(formData: FormData) {
  const householdName = formData.get("household_name") as string;
  const memberName = formData.get("member_name") as string;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.rpc("create_household_with_owner", {
    household_name: householdName,
    member_name: memberName,
  });

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}
