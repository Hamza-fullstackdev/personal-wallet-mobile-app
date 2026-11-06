import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { config } from '../config';
import type { ThemeMode } from '../theme';

interface ThemeState {
  /** Active color scheme. Persisted so the choice survives restarts. */
  mode: ThemeMode;
  /** True once the persisted mode has been restored. */
  hydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
  setHydrated: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      hydrated: false,

      setMode: (mode) => set({ mode }),
      toggle: () => set((state) => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: config.storage.themeMode,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }) as ThemeState,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          useThemeStore.setState({ hydrated: true });
        } else {
          state?.setHydrated();
        }
      },
    },
  ),
);
