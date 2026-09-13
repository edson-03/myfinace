export type Household = {
  id: string;
  name: string;
  created_at: string;
};

export type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: string;
  name: string;
  role: "owner" | "member";
  created_at: string;
};

export type IncomeSourceType =
  | "salario_liquido"
  | "vale_alimentacao"
  | "vale_refeicao"
  | "salario_outro_membro"
  | "comissao"
  | "bonus"
  | "freelance"
  | "uber"
  | "vendas"
  | "aluguel"
  | "outra";

export type Income = {
  id: string;
  household_id: string;
  income_source_id: string | null;
  amount: number;
  date: string;
  is_projected: boolean;
  notes: string | null;
  created_at: string;
};

export type ExpenseGroup = "essencial" | "nao_essencial" | "divida";

export type ExpenseCategory = {
  id: string;
  household_id: string | null;
  parent_id: string | null;
  name: string;
  group: ExpenseGroup;
  is_system: boolean;
};

export type ExpenseStatus = "pendente" | "pago";

export type Expense = {
  id: string;
  household_id: string;
  category_id: string;
  member_id: string | null;
  description: string;
  amount: number;
  date: string;
  due_date: string | null;
  status: ExpenseStatus;
  payment_method: string | null;
  is_recurring: boolean;
  recurring_day: number | null;
  installment_group_id: string | null;
  installment_number: number | null;
  installment_total: number | null;
  debt_id: string | null;
  card_id: string | null;
  created_at: string;
};

export type FinancialGoalType =
  | "reserva_emergencia"
  | "viagem"
  | "casa_propria"
  | "carro"
  | "aposentadoria"
  | "outro";

export type FinancialGoal = {
  id: string;
  household_id: string;
  name: string;
  type: FinancialGoalType;
  target_amount: number;
  target_date: string | null;
  priority: number;
  reserve_months: 3 | 6 | 12 | null;
  created_at: string;
};

export type CreditCard = {
  id: string;
  household_id: string;
  bank: string;
  credit_limit: number;
  closing_day: number;
  due_day: number;
  created_at: string;
};

export type DebtType = "emprestimo" | "financiamento" | "cartao_credito";

export type Debt = {
  id: string;
  household_id: string;
  category_id: string;
  type: DebtType;
  description: string;
  total_amount: number;
  remaining_amount: number;
  interest_rate: number | null;
  installment_amount: number | null;
  installment_total: number | null;
  negotiated: boolean;
  due_day: number | null;
  start_date: string;
  end_date: string | null;
  created_at: string;
};

export type InvestmentCategory = {
  id: string;
  household_id: string | null;
  name: string;
  is_system: boolean;
};

export type Investment = {
  id: string;
  household_id: string;
  name: string;
  category_id: string;
  amount_invested: number;
  current_value: number;
  date: string;
  notes: string | null;
};
