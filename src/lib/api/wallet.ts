import { config } from '../../config';
import { api, type QueryParams } from './client';
import type {
  Category,
  CategorySummary,
  CurrenciesResponse,
  Loan,
  LoanPeopleResponse,
  LoansResponse,
  NotificationsResponse,
  UpdateUserResponse,
  User,
} from '../../types';

/* ─────────────────────────── Auth ─────────────────────────── */

export function getCurrencies(): Promise<CurrenciesResponse> {
  return api.get<CurrenciesResponse>(config.api.currencies);
}

/* ───────────────────────── Categories ───────────────────────── */

export function getCategories(): Promise<CategorySummary> {
  return api.get<CategorySummary>(config.api.categoryGet);
}

export interface AddCategoryPayload {
  name: string;
  description: string;
  balance: number;
}

export function addCategory(payload: AddCategoryPayload): Promise<{ category: Category }> {
  return api.post<{ category: Category }>(config.api.categoryAdd, payload);
}

export interface SwitchBalancePayload {
  from: string;
  to: string;
  balance: number;
}

export function switchBalance(
  payload: SwitchBalancePayload,
): Promise<{ fromCategory: Category; toCategory: Category }> {
  return api.post<{ fromCategory: Category; toCategory: Category }>(
    config.api.categorySwitch,
    payload,
  );
}

/* ────────────────────── Income / Expense ────────────────────── */

export interface BalanceEntryPayload {
  balance: number;
  categoryId: string;
  description: string;
}

export function addIncoming(payload: BalanceEntryPayload): Promise<{ category: Category }> {
  return api.post<{ category: Category }>(config.api.incomingsAdd, payload);
}

export function addOutgoing(payload: BalanceEntryPayload): Promise<{ category: Category }> {
  return api.post<{ category: Category }>(config.api.outgoingsAdd, payload);
}

/* ──────────────────────────── Loans ──────────────────────────── */

export interface LoanQuery extends QueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function getLoans(query: LoanQuery = {}): Promise<LoansResponse> {
  return api.get<LoansResponse>(config.api.loanHistory, query);
}

export function getLoanPeople(): Promise<LoanPeopleResponse> {
  return api.get<LoanPeopleResponse>(config.api.loanPeople);
}

export interface AddLoanPayload {
  name: string;
  reason: string;
  balance: number;
  categoryId: string;
  date: string;
  return: string;
}

export function addLoan(payload: AddLoanPayload): Promise<{ category: Category }> {
  return api.post<{ category: Category }>(config.api.loanAdd, payload);
}

export interface ReturnLoanPayload {
  categoryId: string;
  loanId: string;
  balance: number;
}

export function returnLoan(payload: ReturnLoanPayload): Promise<{ loan: Loan }> {
  return api.post<{ loan: Loan }>(config.api.loanReturn, payload);
}

/* ──────────────────────── Notifications ──────────────────────── */

export interface NotificationQuery extends QueryParams {
  page?: number;
  limit?: number;
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function getNotifications(query: NotificationQuery = {}): Promise<NotificationsResponse> {
  return api.get<NotificationsResponse>(config.api.notifications, query);
}

/* ──────────────────────────── User ───────────────────────────── */

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  currency?: string;
}

export function updateUser(payload: UpdateUserPayload): Promise<UpdateUserResponse> {
  return api.patch<UpdateUserResponse>(config.api.userUpdate, payload);
}

export type { User };
