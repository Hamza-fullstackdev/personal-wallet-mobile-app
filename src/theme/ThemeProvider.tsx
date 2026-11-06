import { useMemo } from 'react';

import { useThemeStore } from '../store/themeStore';
import { getGradients, paletteFor, type ThemeColors } from './index';

/**
 * Access the active palette and theme controls from any component.
 * Re-renders automatically when the user flips light/dark mode.
 */
export function useTheme() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const toggle = useThemeStore((state) => state.toggle);

  const colors = paletteFor(mode);
  const gradients = useMemo(() => getGradients(colors), [colors]);

  return { mode, colors, gradients, setMode, toggle };
}

/**
 * Build a themed StyleSheet once per palette. Define the factory at module
 * scope so its identity stays stable:
 *
 *   const createStyles = (colors: ThemeColors) => StyleSheet.create({ ... });
 *   const styles = useThemedStyles(createStyles);
 */
export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [factory, colors]);
}
