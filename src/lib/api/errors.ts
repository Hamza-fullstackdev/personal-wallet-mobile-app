/** Shared API error type (kept dependency-free to avoid import cycles). */
export class ApiError extends Error {
  status: number;
  data: unknown;
  /** Optional machine-readable code so callers can make retry decisions. */
  code?: string;

  constructor(status: number, message: string, data: unknown = null, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.code = code;
  }
}
