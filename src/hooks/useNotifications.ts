import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getNotifications, type NotificationQuery } from '../lib/api/wallet';
import { queryKeys } from '../lib/queryKeys';
import { errorMessage } from './errorMessage';

export function useNotifications(filters: NotificationQuery) {
  const query = useQuery({
    queryKey: queryKeys.notifications.list(filters),
    queryFn: () => getNotifications(filters),
    placeholderData: keepPreviousData,
  });

  return {
    notifications: query.data?.notifications ?? [],
    meta: query.data?.meta ?? null,
    availableTypes: query.data?.filters?.types ?? [],
    loading: query.isLoading,
    refreshing: query.isFetching,
    error: query.error ? errorMessage(query.error, 'Failed to load history.') : null,
    refetch: query.refetch,
  };
}
