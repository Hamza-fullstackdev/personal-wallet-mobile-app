/**
 * Formatting helpers.
 *
 * Amount formatting mirrors the backend: PKR (and other zero-decimal
 * currencies) render as whole numbers, everything else keeps 2 decimals.
 */

/** Currencies shown without decimal places. */
const ZERO_DECIMAL = new Set(['PKR', 'JPY', 'KRW', 'VND', 'CLP', 'ISK']);

/** Placeholder shown when amounts are hidden for privacy. */
export const AMOUNT_MASK = '••••••';

export function formatAmount(
  value: number | null | undefined,
  currency = 'PKR',
  hidden = false,
): string {
  if (hidden) return AMOUNT_MASK;
  const amount = Number(value ?? 0);
  const safe = Number.isFinite(amount) ? amount : 0;
  const digits = ZERO_DECIMAL.has(currency.toUpperCase()) ? 0 : 2;
  return safe.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** "PKR 12,000" style label. */
export function formatCurrency(value: number | null | undefined, currency = 'PKR'): string {
  return `${currency} ${formatAmount(value, currency)}`;
}

/** Compact signed label: "+ 500" / "- 200". */
export function signedAmount(value: number, currency = 'PKR'): string {
  const sign = value < 0 ? '- ' : '+ ';
  return `${sign}${formatAmount(Math.abs(value), currency)}`;
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** "Sep 17, 2026" */
export function formatDate(value: string | Date | null | undefined, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** "17 Sep 2026, 03:24 PM" */
export function formatDateTime(value: string | Date | null | undefined, fallback = '—'): string {
  const date = toDate(value);
  if (!date) return fallback;
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${formatDate(date)}, ${hours.toString().padStart(2, '0')}:${minutes} ${meridiem}`;
}

/** YYYY-MM-DD for API query params and date fields. */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Date N days before today (used by statement presets). */
export function daysAgo(days: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

/** First letter of a name, for avatars. */
export function initialOf(name?: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || '?';
}
