import { redirect } from "next/navigation";
import { Users, AlertCircle } from "lucide-react";
import { getCurrentMember } from "@/lib/household";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Form } from "@/components/ui/form";
import { createHousehold } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { userId, member } = await getCurrentMember();

  if (!userId) {
    redirect("/login");
  }

  if (member) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Vamos começar</h1>
            <p className="text-sm text-muted-foreground">
              Crie seu grupo familiar para organizar as finanças
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-danger-bg p-3 text-sm text-danger">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <Card className="p-6">
          <Form action={createHousehold} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="household_name">Nome da família / grupo</Label>
              <Input
                id="household_name"
                name="household_name"
                type="text"
                required
                placeholder="Família Silva"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="member_name">Seu nome</Label>
              <Input id="member_name" name="member_name" type="text" required />
            </div>

            <SubmitButton className="w-full">Criar grupo</SubmitButton>
          </Form>
        </Card>
      </div>
    </main>
  );
}
