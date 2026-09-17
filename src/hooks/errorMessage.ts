import type { ApiError } from '../lib/api/errors';

/** Human-readable message for any thrown query/mutation error. */
export function errorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (!error) return fallback;
  if (error instanceof Error && error.message) return error.message;
  return (error as ApiError)?.message ?? fallback;
}
