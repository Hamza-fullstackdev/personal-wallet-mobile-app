import { config } from '../../config';
import type { ExpensesResponse } from '../../types';
import { api, type QueryParams } from './client';

export interface ExpenseQuery extends QueryParams {
  startDate?: string;
  endDate?: string;
}

export function getExpenses(query: ExpenseQuery): Promise<ExpensesResponse> {
  return api.get<ExpensesResponse>(config.api.expenses, query);
}
