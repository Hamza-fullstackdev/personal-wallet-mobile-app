import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { getCategories } from '../lib/api/wallet';
import { queryKeys } from '../lib/queryKeys';
import type { Category } from '../types';
import { errorMessage } from './errorMessage';

interface UseCategoriesResult {
  categories: Category[];
  totalBalance: number;
  loanBalance: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

function useQueryCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: getCategories,
    staleTime: 15_000,
  });
}

/**
 * Loads `/api/user/category/get`. Pass `refreshOnFocus` to re-fetch whenever
 * the screen regains focus (keeps balances fresh after adding entries).
 */
export function useCategories(refreshOnFocus = false): UseCategoriesResult {
  const query = useQueryCategories();
  const { refetch } = query;

  useFocusEffect(
    useCallback(() => {
      if (refreshOnFocus) void refetch();
    }, [refreshOnFocus, refetch]),
  );

  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    categories: query.data?.categories ?? [],
    totalBalance: query.data?.totalBalance ?? 0,
    loanBalance: query.data?.loanBalance ?? 0,
    loading: query.isLoading,
    refreshing: query.isFetching,
    error: query.error ? errorMessage(query.error, 'Failed to load categories.') : null,
    reload,
  };
}

export default useCategories;
