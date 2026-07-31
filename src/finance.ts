import type {
  FinanceRecord,
  FinanceSummary,
  CategorySummary,
  Category,
} from './types.js';

export function calculateSummary(records: FinanceRecord[]): FinanceSummary {
  let totalIncome = 0;
  let totalPersonalExpenses = 0;
  let totalGeneralExpenses = 0;
  let totalInvestments = 0;

  for (const r of records) {
    switch (r.category) {
      case 'income':
        totalIncome += r.amount;
        break;
      case 'personal_expense':
        totalPersonalExpenses += r.amount;
        break;
      case 'general_expense':
        totalGeneralExpenses += r.amount;
        break;
      case 'investment':
        totalInvestments += r.amount;
        break;
    }
  }

  const totalExpenses = totalPersonalExpenses + totalGeneralExpenses;

  return {
    totalIncome,
    totalPersonalExpenses,
    totalGeneralExpenses,
    totalExpenses,
    totalInvestments,
    netBalance: totalIncome - totalExpenses - totalInvestments,
    recordCount: records.length,
  };
}

export function getCategoryBreakdown(records: FinanceRecord[]): CategorySummary[] {
  const map = new Map<Category, { total: number; count: number; subs: Map<string, { total: number; count: number }> }>();

  for (const r of records) {
    let entry = map.get(r.category);
    if (!entry) {
      entry = { total: 0, count: 0, subs: new Map() };
      map.set(r.category, entry);
    }
    entry.total += r.amount;
    entry.count++;

    if (r.subcategory) {
      let sub = entry.subs.get(r.subcategory);
      if (!sub) {
        sub = { total: 0, count: 0 };
        entry.subs.set(r.subcategory, sub);
      }
      sub.total += r.amount;
      sub.count++;
    }
  }

  return Array.from(map.entries()).map(([category, data]) => ({
    category,
    total: data.total,
    count: data.count,
    subcategories: data.subs,
  }));
}

export function filterByDateRange(
  records: FinanceRecord[],
  start: Date,
  end: Date,
): FinanceRecord[] {
  const s = start.getTime();
  const e = end.getTime();
  return records.filter(r => {
    const t = r.date.getTime();
    return t >= s && t <= e;
  });
}

export function filterByCategory(
  records: FinanceRecord[],
  category: Category,
): FinanceRecord[] {
  return records.filter(r => r.category === category);
}
