-- Estrutura familiar

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

-- Receitas

create table income_sources (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  member_id uuid references household_members(id) on delete set null,
  name text not null,
  kind text not null check (kind in ('principal', 'secundaria')),
  type text not null check (type in (
    'salario_liquido', 'vale_alimentacao', 'vale_refeicao',
    'salario_outro_membro', 'comissao', 'bonus', 'freelance',
    'uber', 'vendas', 'aluguel', 'outra'
  )),
  is_recurring boolean not null default true,
  recurring_day int check (recurring_day between 1 and 31),
  default_amount numeric(12, 2),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table incomes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  income_source_id uuid references income_sources(id) on delete set null,
  amount numeric(12, 2) not null,
  date date not null,
  is_projected boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

-- Categorias e despesas

create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  parent_id uuid references expense_categories(id) on delete cascade,
  name text not null,
  "group" text not null check ("group" in ('essencial', 'nao_essencial', 'divida')),
  is_system boolean not null default false
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null references expense_categories(id) on delete restrict,
  member_id uuid references household_members(id) on delete set null,
  description text not null,
  amount numeric(12, 2) not null,
  date date not null,
  due_date date,
  status text not null default 'pendente' check (status in ('pendente', 'pago')),
  payment_method text,
  is_recurring boolean not null default false,
  recurring_day int check (recurring_day between 1 and 31),
  installment_group_id uuid,
  installment_number int,
  installment_total int,
  debt_id uuid,
  created_at timestamptz not null default now()
);

create table expense_attachments (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  file_url text not null,
  uploaded_at timestamptz not null default now()
);

-- Dívidas e obrigações

create table debts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null references expense_categories(id) on delete restrict,
  type text not null check (type in ('emprestimo', 'financiamento', 'cartao_credito')),
  description text not null,
  total_amount numeric(12, 2) not null,
  remaining_amount numeric(12, 2) not null,
  interest_rate numeric(6, 3),
  installment_amount numeric(12, 2) not null,
  due_day int check (due_day between 1 and 31),
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now()
);

alter table expenses
  add constraint expenses_debt_id_fkey foreign key (debt_id) references debts(id) on delete set null;

-- Planejamento financeiro

create table financial_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  type text not null check (type in (
    'reserva_emergencia', 'viagem', 'casa_propria', 'carro', 'aposentadoria', 'outro'
  )),
  target_amount numeric(12, 2) not null,
  target_date date,
  priority int not null default 0,
  created_at timestamptz not null default now()
);

create table goal_contributions (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references financial_goals(id) on delete cascade,
  amount numeric(12, 2) not null,
  date date not null,
  notes text
);

-- Investimentos

create table investments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  type text not null check (type in (
    'renda_fixa', 'renda_variavel', 'fundo', 'previdencia', 'outro'
  )),
  amount_invested numeric(12, 2) not null,
  current_value numeric(12, 2) not null,
  date date not null,
  notes text
);

-- Índices

create index on household_members (user_id);
create index on incomes (household_id, date);
create index on expenses (household_id, date);
create index on expenses (installment_group_id);
create index on expense_categories (household_id);
create index on goal_contributions (goal_id);

-- Categorias padrão do sistema (household_id null = global)

insert into expense_categories (name, "group", is_system) values
  ('Moradia', 'essencial', true),
  ('Utilidades', 'essencial', true),
  ('Alimentação', 'essencial', true),
  ('Saúde', 'essencial', true),
  ('Proteção', 'essencial', true),
  ('Investimentos', 'essencial', true),
  ('Outras Essenciais', 'essencial', true),
  ('Não Essenciais', 'nao_essencial', true),
  ('Dívidas', 'divida', true);

insert into expense_categories (parent_id, name, "group", is_system)
select id, sub.name, 'essencial', true
from expense_categories, lateral (
  values
    ('Aluguel'), ('Financiamento'), ('Condomínio'), ('IPTU')
) as sub(name)
where expense_categories.name = 'Moradia' and expense_categories.is_system;

insert into expense_categories (parent_id, name, "group", is_system)
select id, sub.name, 'essencial', true
from expense_categories, lateral (
  values ('Água'), ('Energia'), ('Gás'), ('Internet')
) as sub(name)
where expense_categories.name = 'Utilidades' and expense_categories.is_system;

insert into expense_categories (parent_id, name, "group", is_system)
select id, sub.name, 'essencial', true
from expense_categories, lateral (
  values ('Supermercado'), ('Feira'), ('Padaria')
) as sub(name)
where expense_categories.name = 'Alimentação' and expense_categories.is_system;

insert into expense_categories (parent_id, name, "group", is_system)
select id, sub.name, 'essencial', true
from expense_categories, lateral (
  values ('Plano de Saúde'), ('Medicamentos'), ('Psicólogo'), ('Tratamentos')
) as sub(name)
where expense_categories.name = 'Saúde' and expense_categories.is_system;

insert into expense_categories (parent_id, name, "group", is_system)
select id, 'Seguro de Vida', 'essencial', true
from expense_categories
where expense_categories.name = 'Proteção' and expense_categories.is_system;

insert into expense_categories (parent_id, name, "group", is_system)
select id, 'Investimento Mensal Obrigatório', 'essencial', true
from expense_categories
where expense_categories.name = 'Investimentos' and expense_categories.is_system;

insert into expense_categories (parent_id, name, "group", is_system)
select id, sub.name, 'nao_essencial', true
from expense_categories, lateral (
  values
    ('Academia'), ('Streaming'), ('Aplicativos'), ('Assinaturas'),
    ('Restaurantes'), ('iFood'), ('Lazer'), ('Viagens'), ('Salão'),
    ('Compras'), ('Assinaturas Digitais')
) as sub(name)
where expense_categories.name = 'Não Essenciais' and expense_categories.is_system;

insert into expense_categories (parent_id, name, "group", is_system)
select id, sub.name, 'divida', true
from expense_categories, lateral (
  values ('Empréstimos'), ('Financiamentos'), ('Cartão de Crédito')
) as sub(name)
where expense_categories.name = 'Dívidas' and expense_categories.is_system;

-- RLS

alter table households enable row level security;
alter table household_members enable row level security;
alter table income_sources enable row level security;
alter table incomes enable row level security;
alter table expense_categories enable row level security;
alter table expenses enable row level security;
alter table expense_attachments enable row level security;
alter table debts enable row level security;
alter table financial_goals enable row level security;
alter table goal_contributions enable row level security;
alter table investments enable row level security;

create or replace function is_household_member(hh_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from household_members
    where household_id = hh_id and user_id = auth.uid()
  );
$$;

create policy "members can view their households"
  on households for select
  using (is_household_member(id));

create policy "members can update their households"
  on households for update
  using (is_household_member(id));

create policy "members can view household_members of their households"
  on household_members for select
  using (is_household_member(household_id));

create policy "owners manage household_members"
  on household_members for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "members access income_sources"
  on income_sources for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "members access incomes"
  on incomes for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "everyone reads system categories, members read their own"
  on expense_categories for select
  using (is_system or is_household_member(household_id));

create policy "members manage their own categories"
  on expense_categories for insert
  with check (not is_system and is_household_member(household_id));

create policy "members update their own categories"
  on expense_categories for update
  using (not is_system and is_household_member(household_id));

create policy "members delete their own categories"
  on expense_categories for delete
  using (not is_system and is_household_member(household_id));

create policy "members access expenses"
  on expenses for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "members access expense_attachments"
  on expense_attachments for all
  using (exists (
    select 1 from expenses
    where expenses.id = expense_attachments.expense_id
      and is_household_member(expenses.household_id)
  ))
  with check (exists (
    select 1 from expenses
    where expenses.id = expense_attachments.expense_id
      and is_household_member(expenses.household_id)
  ));

create policy "members access debts"
  on debts for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "members access financial_goals"
  on financial_goals for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

create policy "members access goal_contributions"
  on goal_contributions for all
  using (exists (
    select 1 from financial_goals
    where financial_goals.id = goal_contributions.goal_id
      and is_household_member(financial_goals.household_id)
  ))
  with check (exists (
    select 1 from financial_goals
    where financial_goals.id = goal_contributions.goal_id
      and is_household_member(financial_goals.household_id)
  ));

create policy "members access investments"
  on investments for all
  using (is_household_member(household_id))
  with check (is_household_member(household_id));

-- Criação atômica de household + membro owner (evita o problema de RLS de
-- não haver membership no instante em que o household é criado).
create or replace function create_household_with_owner(household_name text, member_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into households (name) values (household_name)
  returning id into new_household_id;

  insert into household_members (household_id, user_id, name, role)
  values (new_household_id, auth.uid(), member_name, 'owner');

  return new_household_id;
end;
$$;
