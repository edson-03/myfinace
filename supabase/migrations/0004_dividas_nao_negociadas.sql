-- Dívidas ainda não negociadas (ex: fatura de cartão em aberto) não têm
-- parcela fixa nem quantidade de parcelas definida.

alter table debts
  add column negotiated boolean not null default true;

alter table debts
  alter column installment_amount drop not null;
