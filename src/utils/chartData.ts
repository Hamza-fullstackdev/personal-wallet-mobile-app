import type { ThemeColors } from '../theme';
import type { StatementTransaction } from '../types';

export type CashflowBucketMode = 'day' | 'week' | 'month';

export interface CashflowPoint {
  key: string;
  label: string;
  income: number;
  spending: number;
}

export interface CategorySlice {
  name: string;
  value: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfBucket(date: Date, mode: CashflowBucketMode): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);

  if (mode === 'week') {
    const offset = (next.getDay() + 6) % 7;
    next.setDate(next.getDate() - offset);
  } else if (mode === 'month') {
    next.setDate(1);
  }

  return next;
}

function addBucket(date: Date, mode: CashflowBucketMode): Date {
  const next = new Date(date);
  if (mode === 'day') next.setDate(next.getDate() + 1);
  else if (mode === 'week') next.setDate(next.getDate() + 7);
  else next.setMonth(next.getMonth() + 1);
  return next;
}

function bucketKey(date: Date, mode: CashflowBucketMode): string {
  if (mode === 'month') {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  }
  if (mode === 'week') {
    return toISODate(startOfBucket(date, 'week'));
  }
  return toISODate(date);
}

function bucketLabel(date: Date, mode: CashflowBucketMode): string {
  if (mode === 'month') {
    return `${MONTHS[date.getMonth()]} '${date.getFullYear().toString().slice(-2)}`;
  }
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function buildCashflowSeries(
  transactions: StatementTransaction[],
  mode: CashflowBucketMode,
  rangeStart?: Date,
  rangeEnd?: Date,
): CashflowPoint[] {
  const dates = transactions
    .map((item) => new Date(item.rawDate))
    .filter((date) => !Number.isNaN(date.getTime()));

  const start = rangeStart ?? (dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : null);
  const end = rangeEnd ?? (dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null);

  if (!start || !end) return [];

  const buckets = new Map<string, CashflowPoint>();
  let cursor = startOfBucket(start, mode);
  const last = startOfBucket(end, mode);

  while (cursor <= last) {
    const key = bucketKey(cursor, mode);
    buckets.set(key, {
      key,
      label: bucketLabel(cursor, mode),
      income: 0,
      spending: 0,
    });
    cursor = addBucket(cursor, mode);
  }

  for (const transaction of transactions) {
    const date = new Date(transaction.rawDate);
    if (Number.isNaN(date.getTime())) continue;

    const bucket = buckets.get(bucketKey(date, mode));
    if (!bucket) continue;

    bucket.income += transaction.credit;
    bucket.spending += transaction.debit;
  }

  return Array.from(buckets.values());
}

export function buildCategoryBreakdown(transactions: StatementTransaction[]): CategorySlice[] {
  const totals = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.type !== 'outgoing' && transaction.type !== 'investment') continue;

    const value = transaction.debit || transaction.amount;
    if (value <= 0) continue;

    const name =
      transaction.category && transaction.category !== '—'
        ? transaction.category
        : 'General';

    totals.set(name, (totals.get(name) ?? 0) + value);
  }

  const sorted = Array.from(totals, ([name, value]) => ({ name, value })).sort(
    (a, b) => b.value - a.value,
  );

  if (sorted.length <= 6) return sorted;

  const top = sorted.slice(0, 5);
  const other = sorted.slice(5).reduce((sum, item) => sum + item.value, 0);
  return [...top, { name: 'Other', value: other }];
}

export function chartPalette(colors: ThemeColors): string[] {
  return [
    colors.primary,
    colors.success,
    colors.danger,
    colors.primaryLight,
    '#D97706',
    '#0F766E',
    '#8D6E63',
    colors.textMuted,
  ];
}
