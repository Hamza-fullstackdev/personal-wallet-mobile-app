import { useQuery } from '@tanstack/react-query';

import { getLoanPeople } from '../lib/api/wallet';
import { queryKeys } from '../lib/queryKeys';

export function useLoanPeople(enabled = true) {
  const query = useQuery({
    queryKey: queryKeys.loanPeople,
    queryFn: getLoanPeople,
    enabled,
    staleTime: 60_000,
  });

  return {
    people: query.data?.people ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
