import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useAuthStore } from '../store/authStore';
import { getTokenExpiry, isTokenExpired } from '../utils/jwt';

/**
 * Watches the stored session and signs the user out the instant the JWT
 * expires — whether the app is open at that moment, reopened later, or coming
 * back from the background.
 */
export function useSessionGuard() {
  const token = useAuthStore((state) => state.token);
  const signOut = useAuthStore((state) => state.signOut);

  useEffect(() => {
    if (!token) return undefined;

    const expireIfNeeded = () => {
      if (isTokenExpired(token)) void signOut();
    };

    // Catch the case where the app was closed past the expiry time.
    expireIfNeeded();

    // Schedule a precise logout for the exact expiry moment.
    const expiry = getTokenExpiry(token);
    const timer =
      expiry !== null
        ? setTimeout(expireIfNeeded, Math.max(0, expiry - Date.now() + 1000))
        : undefined;

    // Re-check whenever the app is brought back to the foreground.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') expireIfNeeded();
    });

    return () => {
      if (timer) clearTimeout(timer);
      subscription.remove();
    };
  }, [token, signOut]);
}

export default useSessionGuard;
