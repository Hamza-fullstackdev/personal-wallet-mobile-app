/**
 * API types — mirror the exact response shapes returned by the Next.js backend.
 * Do not rename fields; they come straight from the server.
 */

export interface User {
  _id: string;
  name: string;
  email: string;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
}

export interface UpdateUserResponse {
  message: string;
  user: User;
}

export interface Category {
  _id: string;
  userId: string;
  name: string;
  slug: string;
  description: string;
  balance: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategorySummary {
  categories: Category[];
  totalBalance: number;
  loanBalance: number;
}

export interface Currencie {
  _id: string;
  name: string;
  country: string;
  currency: string;
  symbol: string;
  price: number;
}

export type LoanStatus = 'pending' | 'returned';

export interface Loan {
  _id: string;
  userId: string;
  name: string;
  balance: number;
  reason: string;
  date: string;
  return: string;
  status: LoanStatus;
  categoryId: string;
  createdAt?: string;
  updatedAt?: string;
}

export type NotificationType = 'incoming' | 'outgoing' | 'loan' | 'return' | 'switch';

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface LoansResponse {
  loans: Loan[];
  meta: PaginationMeta;
  filters: { statuses: LoanStatus[] };
}

export interface NotificationsResponse {
  notifications: Notification[];
  meta: PaginationMeta;
  filters: { types: NotificationType[] };
}

export interface LoanPeopleResponse {
  people: string[];
}

export interface CurrenciesResponse {
  currencies: Currencie[];
}

/* ───────────────────────── Bank statement ───────────────────────── */

export interface StatementPeriod {
  startDate: string | null;
  endDate: string | null;
  statementDate: string;
  statementRef: string;
}

export interface StatementSummary {
  openingBalance: number;
  closingBalance: number;
  totalIncoming: number;
  totalOutgoing: number;
  totalLoanGiven: number;
  totalLoanReturned: number;
  totalCredit: number;
  totalDebit: number;
  netCashFlow: number;
  transactionCount: number;
}

export interface StatementCategory {
  id: string;
  name: string;
  balance: number;
}

export type TransactionType = 'incoming' | 'outgoing' | 'loan' | 'return' | 'switch' | 'other';

export interface StatementTransaction {
  id: string;
  date: string;
  rawDate: string;
  type: TransactionType;
  typeLabel: string;
  title: string;
  description: string;
  category: string;
  debit: number;
  credit: number;
  amount: number;
  runningBalance: number;
}

export interface StatementData {
  accountHolder: { name: string; email: string; currency: string };
  filterPerson?: string;
  period: StatementPeriod;
  summary: StatementSummary;
  categories: StatementCategory[];
  transactions: StatementTransaction[];
}
