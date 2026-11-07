import { useQuery } from '@tanstack/react-query';

import { getExpenses, type ExpenseQuery } from '../lib/api/expenses';
import { queryKeys } from '../lib/queryKeys';
import { errorMessage } from './errorMessage';

export function useExpenses(filters: ExpenseQuery) {
  const query = useQuery({
    queryKey: queryKeys.expenses.list(filters),
    queryFn: () => getExpenses(filters),
  });

  return {
    expenses: query.data?.expenses ?? [],
    loading: query.isLoading,
    refreshing: query.isFetching,
    error: query.error ? errorMessage(query.error, 'Failed to load expenses.') : null,
    refetch: query.refetch,
  };
}
