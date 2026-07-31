import type { FinanceRecord, MonthlyComparison } from './types.js';

export function getMonthlyComparisons(records: FinanceRecord[]): MonthlyComparison[] {
  const monthMap = new Map<string, MonthlyComparison>();

  const getKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  for (const r of records) {
    const key = getKey(r.date);
    let entry = monthMap.get(key);
    if (!entry) {
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      entry = {
        year: r.date.getFullYear(),
        month: r.date.getMonth() + 1,
        label: `${monthNames[r.date.getMonth()]} ${r.date.getFullYear()}`,
        income: 0,
        expenses: 0,
        investments: 0,
        net: 0,
      };
      monthMap.set(key, entry);
    }

    switch (r.category) {
      case 'income':
        entry.income += r.amount;
        break;
      case 'personal_expense':
      case 'general_expense':
        entry.expenses += r.amount;
        break;
      case 'investment':
        entry.investments += r.amount;
        break;
    }

    entry.net = entry.income - entry.expenses - entry.investments;
  }

  return Array.from(monthMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
}

export interface ComparisonData {
  labels: string[];
  incomeData: number[];
  expensesData: number[];
  investmentData: number[];
  netData: number[];
}

export function getComparisonChartData(records: FinanceRecord[]): ComparisonData {
  const comparisons = getMonthlyComparisons(records);
  return {
    labels: comparisons.map(c => c.label),
    incomeData: comparisons.map(c => c.income),
    expensesData: comparisons.map(c => c.expenses),
    investmentData: comparisons.map(c => c.investments),
    netData: comparisons.map(c => c.net),
  };
}
