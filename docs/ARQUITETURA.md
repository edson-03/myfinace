# Arquitetura — Sistema Financeiro Pessoal/Familiar

Documento de arquitetura da Parte 1 do prompt. Cobre modelo de dados e decisões
estruturais para as funcionalidades já especificadas (Dashboard, Receitas,
Despesas, Fluxo de Caixa, Planejamento Financeiro). Aguardando próximas partes
do prompt para detalhar telas, regras adicionais e indicadores.

## Escopo e premissas

- Uso pessoal/familiar: um "household" (grupo familiar) com múltiplos membros,
  sem billing, planos ou isolamento multi-tenant tipo SaaS comercial.
- Stack alvo: Next.js + Supabase (Postgres + Auth + Storage para comprovantes).
- Autenticação via Supabase Auth. Cada usuário pertence a um ou mais
  households (ex: pai e mãe no mesmo grupo familiar).
- Moeda única (BRL), sem suporte a múltiplas moedas nesta fase.
- Fluxo de caixa e indicadores do dashboard são **calculados** a partir de
  receitas/despesas, não são tabelas próprias.

## Stack técnica

| Camada | Escolha | Motivo |
|---|---|---|
| Frontend | Next.js (App Router) + TypeScript | SSR/SSG, ecossistema React, deploy simples na Vercel |
| Backend | Supabase (Postgres + Auth + Storage + RLS) | evita construir API própria; Row Level Security cobre isolamento por household |
| UI | Tailwind + componentes prontos (ex: shadcn/ui) | velocidade, consistência visual |
| Gráficos | biblioteca de charts (a definir na parte de UI) | dashboard com cards/gráficos/tendências |

## Modelo de dados

### Estrutura familiar

```
households (id, name, created_at)
household_members (id, household_id, user_id, name, role[owner|member], created_at)
```

Todas as tabelas abaixo carregam `household_id` e usam RLS para restringir
acesso aos membros do household.

### Receitas

```
income_sources
  id, household_id, member_id (nullable),
  name, kind [principal|secundaria],
  type [salario_liquido|vale_alimentacao|vale_refeicao|salario_outro_membro|
        comissao|bonus|freelance|uber|vendas|aluguel|outra],
  is_recurring bool, recurring_day int (1-31, nullable),
  default_amount numeric, active bool

incomes
  id, household_id, income_source_id (nullable, null = lançamento avulso),
  amount numeric, date date, is_projected bool,
  notes text, created_at
```

- `income_sources` = template (define recorrência e valor padrão).
- `incomes` = lançamentos reais (ou projetados, para saldo projetado).
- Receita variável = `income_source` sem `default_amount` fixo; cada
  `income` lançado com valor próprio.

### Despesas

```
expense_categories
  id, household_id (nullable = categoria padrão do sistema),
  parent_id (nullable, para subcategoria),
  name, group [essencial|nao_essencial|divida],
  is_system bool

expenses
  id, household_id, category_id, member_id (nullable),
  description, amount numeric,
  date date, due_date date,
  status [pendente|pago],
  payment_method text (nullable),
  is_recurring bool, recurring_day int (nullable),
  installment_group_id uuid (nullable),
  installment_number int (nullable), installment_total int (nullable),
  created_at

expense_attachments
  id, expense_id, file_url, uploaded_at
```

Categorias padrão (`is_system = true`, pré-carregadas, `household_id` null):

- **Essencial > Moradia**: Aluguel, Financiamento, Condomínio, IPTU
- **Essencial > Utilidades**: Água, Energia, Gás, Internet
- **Essencial > Alimentação**: Supermercado, Feira, Padaria
- **Essencial > Saúde**: Plano de Saúde, Medicamentos, Psicólogo, Tratamentos
- **Essencial > Proteção**: Seguro de Vida
- **Essencial > Investimentos**: Investimento Mensal Obrigatório
- **Essencial > Outras**: livre (usuário cria subcategorias)
- **Não essencial**: Academia, Streaming, Aplicativos, Assinaturas,
  Restaurantes, iFood, Lazer, Viagens, Salão, Compras, Assinaturas Digitais
- **Dívida**: Empréstimos, Financiamentos, Cartão de Crédito

Usuário pode criar categorias/subcategorias próprias (`household_id`
preenchido, `is_system = false`) dentro de qualquer grupo.

Parcelamento: uma compra parcelada gera N linhas em `expenses` com o mesmo
`installment_group_id`, `installment_total` fixo e `installment_number`
incremental (1..N), cada uma com sua própria `date`/`due_date`.

Recorrência: `is_recurring + recurring_day` funciona como regra simples
mensal. Um job (cron/Edge Function) gera a linha do mês seguinte quando
necessário, ou a projeção é calculada em memória para o dashboard sem
persistir até o mês virar.

### Dívidas e obrigações

Dívidas usam a categoria `group = divida` em `expenses` para as parcelas
mensais, mais uma tabela de controle do contrato:

```
debts
  id, household_id, category_id,
  type [emprestimo|financiamento|cartao_credito],
  description, total_amount, remaining_amount,
  interest_rate numeric (nullable),
  installment_amount numeric, due_day int,
  start_date date, end_date date (nullable)
```

Cada parcela paga é um registro em `expenses` (group=divida) linkado por
`installment_group_id` = `debts.id` (ou campo `debt_id` opcional em
`expenses`), permitindo abatimento de `remaining_amount`.

### Planejamento financeiro (metas)

```
financial_goals
  id, household_id, name,
  type [reserva_emergencia|viagem|casa_propria|carro|aposentadoria|outro],
  target_amount numeric, target_date date (nullable),
  priority int, created_at

goal_contributions
  id, goal_id, amount numeric, date date, notes text
```

Reserva de emergência é uma `financial_goal` com `type = reserva_emergencia`.
O valor "ideal" sugerido (ex: 6x despesas essenciais mensais) é calculado a
partir de `expenses` (group=essencial), não armazenado.

### Investimentos

```
investments
  id, household_id, name,
  type [renda_fixa|renda_variavel|fundo|previdencia|outro],
  amount_invested numeric, current_value numeric,
  date date, notes text
```

## Indicadores calculados (Dashboard / Fluxo de Caixa)

Todos derivados por query, sem tabela própria:

- Receita total / Despesa total (soma por período)
- Saldo atual = receitas realizadas − despesas realizadas (status=pago)
- Saldo projetado = inclui `incomes.is_projected` e recorrências futuras
- Investimentos = soma `investments.current_value`
- Reserva de emergência = `goal_contributions` somado vs `target_amount`
- Fluxo de caixa diário/semanal/mensal/anual = agregação de `incomes` e
  `expenses` por `date`, agrupado no período pedido

## Segurança (RLS)

Toda tabela com `household_id` tem policy: usuário só lê/escreve linhas de
households onde aparece em `household_members`. Categorias do sistema
(`is_system=true`, `household_id null`) são leitura pública para
autenticados.

## Em aberto para as próximas partes do prompt

- Layout e componentes do Dashboard (quais gráficos, cards, alertas)
- Regras exatas de "alertas" (ex: gasto > orçamento, fatura próxima do vencimento)
- Fluxo de upload de comprovantes (Storage bucket, formatos aceitos)
- Regras de orçamento por categoria (se haverá tela de orçamento mensal)
- Definição de papéis dentro do household (permissões owner vs member)
