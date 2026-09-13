import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { HouseholdMember } from "@/lib/types";

export async function getCurrentMember(): Promise<{
  userId: string;
  member: HouseholdMember | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: "", member: null };
  }

  const { data: member } = await supabase
    .from("household_members")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return { userId: user.id, member: member as HouseholdMember | null };
}

export async function requireMember(): Promise<HouseholdMember> {
  const { userId, member } = await getCurrentMember();

  if (!userId) {
    redirect("/login");
  }

  if (!member) {
    redirect("/onboarding");
  }

  return member;
}
