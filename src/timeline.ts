import type { FinanceRecord, TimelineEntry, TimeGranularity } from './types.js';

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function buildEntry(records: FinanceRecord[], label: string, startDate: Date, endDate: Date): TimelineEntry {
  let income = 0;
  let personalExpenses = 0;
  let generalExpenses = 0;
  let investments = 0;

  for (const r of records) {
    switch (r.category) {
      case 'income': income += r.amount; break;
      case 'personal_expense': personalExpenses += r.amount; break;
      case 'general_expense': generalExpenses += r.amount; break;
      case 'investment': investments += r.amount; break;
    }
  }

  const totalExpenses = personalExpenses + generalExpenses;

  return {
    label,
    startDate,
    endDate,
    income,
    personalExpenses,
    generalExpenses,
    investments,
    totalExpenses,
    netBalance: income - totalExpenses - investments,
    records,
  };
}

function getTimelineKeys(granularity: TimeGranularity, year: number, month?: number): string[] {
  const keys: string[] = [];

  if (granularity === 'daily' && month !== undefined) {
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      keys.push(`${year}-${pad(month)}-${pad(d)}`);
    }
  } else if (granularity === 'weekly') {
    const startWeek = month !== undefined
      ? getWeekNumber(new Date(year, month - 1, 1))
      : 1;
    const endWeek = month !== undefined
      ? getWeekNumber(new Date(year, month, 0))
      : 53;
    for (let w = startWeek; w <= endWeek; w++) {
      keys.push(`${year}-W${pad(w)}`);
    }
  } else if (granularity === 'monthly') {
    for (let m = 1; m <= 12; m++) {
      keys.push(`${year}-${pad(m)}`);
    }
  } else if (granularity === 'yearly') {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 5; y <= currentYear + 1; y++) {
      keys.push(`${y}`);
    }
  }

  return keys;
}

function getDateRangeForKey(key: string, granularity: TimeGranularity): { label: string; start: Date; end: Date } {
  if (granularity === 'daily') {
    const [y, m, d] = key.split('-').map(Number);
    const start = new Date(y!, m! - 1, d!);
    const end = new Date(y!, m! - 1, d!, 23, 59, 59, 999);
    return { label: `${y}-${pad(m!)}-${pad(d!)}`, start, end };
  }

  if (granularity === 'weekly') {
    const [yearStr, , weekStr] = key.split(/[-W]/);
    const year = parseInt(yearStr!);
    const week = parseInt(weekStr!);
    const jan1 = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7;
    const start = new Date(jan1);
    start.setDate(jan1.getDate() + daysOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { label: `Sem ${week}`, start, end };
  }

  if (granularity === 'monthly') {
    const [y, m] = key.split('-').map(Number);
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const start = new Date(y!, m! - 1, 1);
    const end = new Date(y!, m!, 0, 23, 59, 59, 999);
    return { label: `${monthNames[m! - 1]!} ${y}`, start, end };
  }

  if (granularity === 'yearly') {
    const y = parseInt(key);
    const start = new Date(y, 0, 1);
    const end = new Date(y, 11, 31, 23, 59, 59, 999);
    return { label: `${y}`, start, end };
  }

  throw new Error(`Invalid key: ${key}`);
}

export function buildTimeline(
  records: FinanceRecord[],
  granularity: TimeGranularity,
  year: number,
  month?: number,
): TimelineEntry[] {
  const keys = getTimelineKeys(granularity, year, month);
  const entries: TimelineEntry[] = [];

  for (const key of keys) {
    const { label, start, end } = getDateRangeForKey(key, granularity);
    const filtered = records.filter(r => {
      const t = r.date.getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
    entries.push(buildEntry(filtered, label, start, end));
  }

  return entries;
}
