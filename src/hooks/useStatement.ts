import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getStatementData, type StatementQuery } from '../lib/api/statement';
import { queryKeys } from '../lib/queryKeys';
import { errorMessage } from './errorMessage';

export function useStatementData(query: StatementQuery) {
  const result = useQuery({
    queryKey: queryKeys.statement.detail(query),
    queryFn: () => getStatementData(query),
    placeholderData: keepPreviousData,
  });

  return {
    data: result.data ?? null,
    loading: result.isLoading,
    refreshing: result.isFetching,
    error: result.error ? errorMessage(result.error, 'Failed to load statement.') : null,
    refetch: result.refetch,
  };
}
