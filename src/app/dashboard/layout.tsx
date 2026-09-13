import { requireMember } from "@/lib/household";
import { signOut } from "@/app/login/actions";
import { AppShell } from "@/components/app-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await requireMember();

  return (
    <AppShell memberName={member.name} onSignOut={signOut}>
      {children}
    </AppShell>
  );
}
