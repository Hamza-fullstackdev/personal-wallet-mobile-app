/**
 * Minimal, dependency-free JWT helpers.
 *
 * The backend signs the session cookie with a 7-day expiry
 * (`app/api/auth/login/route.ts` → `jwt.sign(..., { expiresIn: '7d' })`).
 * Decoding the `exp` claim locally lets the app log the user out the moment the
 * session expires, without waiting for the next API call.
 */

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export interface JwtPayload {
  id?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

/** Decode a base64url string into its raw byte string. */
function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  let output = '';
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized.charAt(i);
    if (char === '=') break;
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }

  return output;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

/** Expiry timestamp in milliseconds, or null when it cannot be determined. */
export function getTokenExpiry(token: string): number | null {
  const payload = decodeJwt(token);
  return typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
}

/**
 * True when the token is expired (or within `skewMs` of expiring).
 * Tokens without a readable `exp` are treated as not expired so the request
 * still goes out and the server remains the source of truth.
 */
export function isTokenExpired(token: string, skewMs = 5000): boolean {
  const expiry = getTokenExpiry(token);
  if (expiry === null) return false;
  return Date.now() >= expiry - skewMs;
}
