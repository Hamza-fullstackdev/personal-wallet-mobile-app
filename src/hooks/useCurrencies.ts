import { useQuery } from '@tanstack/react-query';

import { getCurrencies } from '../lib/api/wallet';
import { queryKeys } from '../lib/queryKeys';

export function useCurrencies() {
  const query = useQuery({
    queryKey: queryKeys.currencies,
    queryFn: getCurrencies,
    staleTime: 5 * 60_000,
  });

  return {
    currencies: query.data?.currencies ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
