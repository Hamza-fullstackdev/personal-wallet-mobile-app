import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { config } from '../config';
import type { User } from '../types';
import { isTokenExpired } from '../utils/jwt';

interface AuthState {
  /** Signed-in user profile (persisted to AsyncStorage). */
  user: User | null;
  /** Raw session token (kept in memory + SecureStore, never persisted). */
  token: string | null;
  /** True once the stored session has been restored at boot. */
  booted: boolean;

  setUser: (user: User | null) => void;
  bootstrap: () => Promise<void>;
  signIn: (user: User, token: string) => Promise<void>;
  updateProfile: (user: User) => void;
  signOut: () => Promise<void>;
}

/** Resolve once zustand-persist has rehydrated the stored profile. */
function whenHydrated(): Promise<void> {
  const persistApi = useAuthStore.persist;
  if (persistApi.hasHydrated()) return Promise.resolve();

  return new Promise((resolve) => {
    const unsubscribe = persistApi.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      booted: false,

      setUser: (user) => set({ user }),

      bootstrap: async () => {
        // Make sure the persisted profile is available before deciding whether
        // the stored token still represents a valid session.
        await whenHydrated();

        let token: string | null = null;
        try {
          token = await SecureStore.getItemAsync(config.storage.authToken);
        } catch {
          token = null;
        }

        const { user } = get();

        // A session only counts when we have BOTH a token and a profile, and the
        // token has not already expired.
        if (!token || !user || isTokenExpired(token)) {
          try {
            await SecureStore.deleteItemAsync(config.storage.authToken);
          } catch {
            // ignore
          }
          set({ token: null, user: null, booted: true });
          return;
        }

        set({ token, booted: true });
      },

      signIn: async (user, token) => {
        try {
          await SecureStore.setItemAsync(config.storage.authToken, token);
        } catch {
          // SecureStore may be unavailable on some platforms; session still
          // works for the current run from memory.
        }
        set({ user, token });
      },

      updateProfile: (user) => set({ user }),

      signOut: async () => {
        try {
          await SecureStore.deleteItemAsync(config.storage.authToken);
        } catch {
          // ignore
        }
        set({ user: null, token: null });
      },
    }),
    {
      name: config.storage.authUser,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user }) as AuthState,
    },
  ),
);

/** True only when we have both a token and a profile. */
export const selectIsAuthenticated = (state: AuthState) =>
  Boolean(state.token && state.user);
