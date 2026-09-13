-- Cartões de crédito

create table credit_cards (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  bank text not null,
  credit_limit numeric(12, 2) not null,
  closing_day int not null check (closing_day between 1 and 31),
  due_day int not null check (due_day between 1 and 31),
  created_at timestamptz not null default now()
);

alter table credit_cards enable row level security;

create policy "members access credit_cards"
  on credit_cards for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

-- Reserva de emergência configurável (3, 6 ou 12 meses de despesas essenciais)

alter table financial_goals
  add column reserve_months int check (reserve_months in (3, 6, 12));
