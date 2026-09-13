import { Wallet, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Form } from "@/components/ui/form";
import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; mode?: string }>;
}) {
  const { error, message, mode } = await searchParams;
  const isSignUp = mode === "cadastro";

  return (
    <main className="flex flex-1 items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Wallet size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Caixa</h1>
            <p className="text-sm text-muted-foreground">
              {isSignUp ? "Crie sua conta para começar" : "Entre na sua conta"}
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-danger-bg p-3 text-sm text-danger">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
        {message && (
          <div className="flex items-start gap-2 rounded-xl bg-success-bg p-3 text-sm text-success">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            {message}
          </div>
        )}

        <Card className="p-6">
          <Form action={isSignUp ? signUp : signIn} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" type="text" required />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>

            <SubmitButton className="w-full">{isSignUp ? "Criar conta" : "Entrar"}</SubmitButton>
          </Form>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? (
            <>
              Já tem conta?{" "}
              <a href="/login" className="font-medium text-primary hover:underline">
                Entrar
              </a>
            </>
          ) : (
            <>
              Não tem conta?{" "}
              <a href="/login?mode=cadastro" className="font-medium text-primary hover:underline">
                Criar conta
              </a>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
