export type Category = 'income' | 'personal_expense' | 'general_expense' | 'investment';

export type TimeGranularity = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface FinanceRecord {
  id: string;
  date: Date;
  description: string;
  category: Category;
  subcategory: string;
  amount: number;
  notes: string;
}

export interface TimelineEntry {
  label: string;
  startDate: Date;
  endDate: Date;
  income: number;
  personalExpenses: number;
  generalExpenses: number;
  investments: number;
  totalExpenses: number;
  netBalance: number;
  records: FinanceRecord[];
}

export interface CategorySummary {
  category: Category;
  total: number;
  count: number;
  subcategories: Map<string, { total: number; count: number }>;
}

export interface MonthlyComparison {
  year: number;
  month: number;
  label: string;
  income: number;
  expenses: number;
  investments: number;
  net: number;
}

export interface FinanceSummary {
  totalIncome: number;
  totalPersonalExpenses: number;
  totalGeneralExpenses: number;
  totalExpenses: number;
  totalInvestments: number;
  netBalance: number;
  recordCount: number;
}
