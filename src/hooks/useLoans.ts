import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getLoans, type LoanQuery } from '../lib/api/wallet';
import { queryKeys } from '../lib/queryKeys';
import { errorMessage } from './errorMessage';

export function useLoans(filters: LoanQuery) {
  const query = useQuery({
    queryKey: queryKeys.loans.list(filters),
    queryFn: () => getLoans(filters),
    placeholderData: keepPreviousData,
  });

  return {
    loans: query.data?.loans ?? [],
    meta: query.data?.meta ?? null,
    loading: query.isLoading,
    refreshing: query.isFetching,
    error: query.error ? errorMessage(query.error, 'Failed to load loans.') : null,
    refetch: query.refetch,
  };
}
