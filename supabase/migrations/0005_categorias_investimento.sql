-- Categorias de investimento (substitui o enum fixo por categorias
-- editáveis pelo usuário, no mesmo espírito das categorias de despesa).

create table investment_categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  name text not null,
  is_system boolean not null default false
);

alter table investment_categories enable row level security;

create policy "everyone reads system investment categories, members read their own"
  on investment_categories for select
  using (is_system or is_household_member(household_id));

create policy "members manage their own investment categories"
  on investment_categories for insert
  with check (not is_system and is_household_member(household_id));

create policy "members update their own investment categories"
  on investment_categories for update
  using (not is_system and is_household_member(household_id));

create policy "members delete their own investment categories"
  on investment_categories for delete
  using (not is_system and is_household_member(household_id));

insert into investment_categories (name, is_system) values
  ('Renda Fixa', true),
  ('Renda Variável', true),
  ('Fundo', true),
  ('Previdência', true),
  ('Outro', true);

alter table investments add column category_id uuid references investment_categories(id);

update investments i
set category_id = (
  select ic.id from investment_categories ic
  where ic.is_system and (
    (i.type = 'renda_fixa' and ic.name = 'Renda Fixa') or
    (i.type = 'renda_variavel' and ic.name = 'Renda Variável') or
    (i.type = 'fundo' and ic.name = 'Fundo') or
    (i.type = 'previdencia' and ic.name = 'Previdência') or
    (i.type = 'outro' and ic.name = 'Outro')
  )
);

alter table investments alter column category_id set not null;
alter table investments drop column type;
