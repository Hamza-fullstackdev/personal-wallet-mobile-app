import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getTodos, type TodoQuery } from '../lib/api/todos';
import { queryKeys } from '../lib/queryKeys';
import { errorMessage } from './errorMessage';

export function useTodos(filters: TodoQuery) {
  const query = useQuery({
    queryKey: queryKeys.todos.list(filters),
    queryFn: () => getTodos(filters),
    placeholderData: keepPreviousData,
  });

  return {
    todos: query.data?.todos ?? [],
    meta: query.data?.meta ?? null,
    loading: query.isLoading,
    refreshing: query.isFetching,
    error: query.error ? errorMessage(query.error, 'Failed to load todos.') : null,
    refetch: query.refetch,
  };
}
