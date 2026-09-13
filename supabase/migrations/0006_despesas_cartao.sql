-- Vincula uma despesa ao cartão de crédito usado na compra (opcional).
alter table expenses
  add column card_id uuid references credit_cards(id) on delete set null;

create index on expenses (card_id);
