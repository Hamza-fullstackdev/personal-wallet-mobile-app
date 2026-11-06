import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api/errors';

/**
 * Shared React Query client.
 *
 * - Never retries auth/permission/validation failures (4xx) or timeouts.
 * - Retries unreachable-server / 5xx failures once so transient blips recover
 *   without keeping a full-screen loader up for ~90s.
 * - Keeps data fresh for 30s so tab switches do not spam the API.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          if (error.code === 'timeout') return false;
          if (error.status >= 400 && error.status < 500) return false;
        }
        return failureCount < 1;
      },
      retryDelay: 1000,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'always',
    },
    mutations: {
      retry: false,
      networkMode: 'always',
    },
  },
});

export default queryClient;
