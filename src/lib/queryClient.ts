import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api/errors';

/**
 * Shared React Query client.
 *
 * - Never retries auth/permission/validation failures (4xx).
 * - Keeps data fresh for 30s so tab switches do not spam the API.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

export default queryClient;
