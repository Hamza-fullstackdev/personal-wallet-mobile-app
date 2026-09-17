import { config } from '../../config';
import { ApiError, http } from './client';
import type { Credentials, LoginResponse } from '../../types';

/** Pull the raw `token` value out of a `Set-Cookie` header string. */
function parseTokenFromSetCookie(setCookie: string | string[] | null | undefined): string | null {
  const raw = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  if (!raw) return null;

  const firstPair = raw.split(';')[0]?.trim();
  if (!firstPair) return null;

  const separator = firstPair.indexOf('=');
  if (separator === -1) return null;

  const name = firstPair.slice(0, separator).trim();
  const value = firstPair.slice(separator + 1).trim();
  if (name !== 'token' || !value) return null;
  return value;
}

/**
 * POST /api/auth/login
 * Returns the user plus the session token extracted from the httpOnly cookie.
 * The Next.js backend is left untouched — we only read the Set-Cookie header.
 */
export async function login(
  credentials: Credentials,
): Promise<{ user: LoginResponse['user']; token: string }> {
  let response;
  try {
    response = await http.post<LoginResponse>(config.api.login, credentials, {
      // `withCredentials: false` keeps the response's Set-Cookie header readable
      // on iOS/Android instead of letting the native cookie layer swallow it.
      withCredentials: false,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, 'Unable to reach the server. Check your connection.');
  }

  const token = parseTokenFromSetCookie(
    response.headers['set-cookie'] as string | string[] | undefined,
  );
  if (!token) {
    throw new ApiError(500, 'Could not start a session. Please try again.');
  }

  if (!response.data?.user) {
    throw new ApiError(500, 'Unexpected server response.');
  }

  return { user: response.data.user, token };
}
