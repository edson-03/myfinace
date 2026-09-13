import { CreditCard as CreditCardIcon, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireMember } from "@/lib/household";
import { formatBRL } from "@/lib/date";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Form } from "@/components/ui/form";
import { addCard, deleteCard } from "./actions";

const GRADIENTS = [
  "from-indigo-500 to-violet-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-blue-600",
];

export default async function CartoesPage() {
  const member = await requireMember();
  const supabase = await createClient();

  const { data: cards } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("household_id", member.household_id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Cartões</h1>
        <p className="text-sm text-muted-foreground">Seus cartões de crédito</p>
      </div>

      <Card className="p-5">
        <Form action={addCard} className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bank">Banco</Label>
            <Input id="bank" name="bank" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="credit_limit">Limite</Label>
            <Input id="credit_limit" name="credit_limit" type="number" step="0.01" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="closing_day">Dia fechamento</Label>
            <Input id="closing_day" name="closing_day" type="number" min={1} max={31} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="due_day">Dia vencimento</Label>
            <Input id="due_day" name="due_day" type="number" min={1} max={31} required />
          </div>
          <SubmitButton className="sm:col-span-5">Adicionar cartão</SubmitButton>
        </Form>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(cards ?? []).map((card, i) => (
          <div
            key={card.id}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-sm ${GRADIENTS[i % GRADIENTS.length]}`}
          >
            <div className="flex items-start justify-between">
              <CreditCardIcon size={24} className="opacity-90" />
              <form action={deleteCard.bind(null, card.id)}>
                <button
                  type="submit"
                  aria-label="Remover"
                  className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white"
                >
                  <Trash2 size={14} />
                </button>
              </form>
            </div>
            <div className="mt-6 text-lg font-semibold">{card.bank}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">
              {formatBRL(Number(card.credit_limit))}
            </div>
            <div className="mt-4 flex justify-between text-xs text-white/80">
              <span>Fecha dia {card.closing_day}</span>
              <span>Vence dia {card.due_day}</span>
            </div>
          </div>
        ))}
        {(cards ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
            Nenhum cartão cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
