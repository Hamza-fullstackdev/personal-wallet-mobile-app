/**
 * Axios instance for the Personal Wallet backend.
 *
 * AUTH NOTE
 * ---------
 * The Next.js backend authenticates exclusively through the httpOnly `token`
 * cookie (`app/api/utils/verify-user.ts`). React Native has no browser cookie
 * jar, so we capture the `Set-Cookie` value returned by `/api/auth/login`,
 * store the raw token in SecureStore, and echo it back on every request via the
 * `Cookie` request header. This keeps the backend 100% untouched.
 *
 * UNAUTHORIZED HANDLING
 * ---------------------
 * The session is dropped (and the app returns to Login) in three cases:
 *   1. The stored JWT's `exp` claim has passed — checked before every request.
 *   2. A request is answered with 401 (missing token) or 403 (invalid token).
 *   3. The expiry watcher (`useSessionGuard`) fires while the app is open.
 */

import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';

import { config } from '../../config';
import { useAuthStore } from '../../store/authStore';
import { isTokenExpired } from '../../utils/jwt';
import { ApiError } from './errors';

export { ApiError };

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

function extractMessage(data: unknown, status: number): string {
  if (data && typeof data === 'object' && 'message' in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return `Request failed (${status})`;
}

export const http = axios.create({
  baseURL: config.apiBaseUrl,
  // Fail fast: a stuck request must never leave a loading overlay on screen for
  // tens of seconds. Slow endpoints (e.g. PDF export) override this per request.
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

/** Attach the session cookie to every outgoing request. */
http.interceptors.request.use((request: InternalAxiosRequestConfig) => {
  const { token, signOut } = useAuthStore.getState();

  // Never send a request with an already-expired token: drop the session and
  // bounce straight back to the Login screen.
  if (token && isTokenExpired(token)) {
    void signOut();
    return Promise.reject(
      new ApiError(401, 'Your session has expired. Please sign in again.', null, 'session-expired'),
    );
  }

  if (token) request.headers.set('Cookie', `token=${token}`);
  return request;
});

/**
 * Normalise errors and force a logout whenever the backend rejects the session.
 * 401 = missing token, 403 = invalid token — both mean the cookie is no longer
 * usable, so the user is signed out and the navigator returns to Login.
 */
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401 || status === 403) {
        await useAuthStore.getState().signOut();
        return Promise.reject(
          new ApiError(
            status,
            'Your session has expired. Please sign in again.',
            data,
            'unauthorized',
          ),
        );
      }

      return Promise.reject(new ApiError(status, extractMessage(data, status), data));
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return Promise.reject(
        new ApiError(0, 'The request timed out. Please try again.', null, 'timeout'),
      );
    }

    return Promise.reject(
      new ApiError(0, 'Unable to reach the server. Check your connection.', null, 'network'),
    );
  },
);

/** Typed helpers that unwrap `response.data`. */
export const api = {
  get: <T>(url: string, params?: QueryParams): Promise<T> =>
    http.get<T>(url, { params }).then((response) => response.data),
  post: <T>(url: string, body?: unknown): Promise<T> =>
    http.post<T>(url, body).then((response) => response.data),
  patch: <T>(url: string, body?: unknown): Promise<T> =>
    http.patch<T>(url, body).then((response) => response.data),
};

/** Full axios response (used for binary/meta access, e.g. the PDF download). */
export function getRaw(url: string, params?: QueryParams): Promise<AxiosResponse> {
  return http.get(url, { params });
}

export function buildUrl(path: string, params?: QueryParams): string {
  const base = config.apiBaseUrl.replace(/\/+$/, '');
  if (!params) return `${base}${path}`;

  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });

  const query = search.toString();
  return query ? `${base}${path}?${query}` : `${base}${path}`;
}
