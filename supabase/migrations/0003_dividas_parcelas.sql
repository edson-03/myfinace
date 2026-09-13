alter table debts
  add column installment_total int check (installment_total > 0);
