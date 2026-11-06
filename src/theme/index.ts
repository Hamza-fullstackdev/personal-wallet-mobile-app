/**
 * THEME — Single source of truth for the app's look.
 *
 * BRAND RULE: warm copper as the brand accent (no blue/purple), with semantic
 * green for money coming in and red for money going out.
 *
 * Every screen reads colors through `useTheme()` (see ThemeProvider) so the
 * light/dark switch updates the whole app instantly. `LightColors` and
 * `DarkColors` must expose exactly the same keys.
 */

export type ThemeMode = 'light' | 'dark';

export const LightColors = {
  // ─── Brand copper ────────────────────────────────────────────────────────
  /** Main accent used for buttons, icons and active states. */
  primary: '#A3541F',
  /** Strong copper for emphasis text and pressed states. */
  primaryDeep: '#7E3F18',
  /** Lighter copper for secondary accents. */
  primaryLight: '#C97A42',
  /** Soft copper tint for badges, chips and icon backgrounds. */
  primarySoft: '#F7EBDF',
  /** Very light copper for section fills. */
  primaryFaint: '#FCF7F1',
  /** Text / icons sitting on top of the brand gradient. */
  onPrimary: '#FFFFFF',

  // ─── Surfaces ────────────────────────────────────────────────────────────
  background: '#FFFDFB',
  surface: '#FFFFFF',
  surfaceAlt: '#FAF5EF',
  border: '#EADDD1',
  divider: '#F1E7DD',

  // ─── Text (warm neutrals) ────────────────────────────────────────────────
  textPrimary: '#2A211B',
  textSecondary: '#6B5D50',
  textMuted: '#A08F7E',

  // ─── Semantic / status ───────────────────────────────────────────────────
  /** Positive / money-in accent. */
  success: '#15803D',
  successSoft: 'rgba(21,128,61,0.12)',
  successFaint: 'rgba(21,128,61,0.06)',
  /** Negative / money-out accent. */
  danger: '#C2352B',
  dangerSoft: 'rgba(194,53,43,0.12)',
  dangerFaint: 'rgba(194,53,43,0.06)',

  // ─── Brand gradient stops ────────────────────────────────────────────────
  gradientFrom: '#A3541F',
  gradientTo: '#7E3F18',

  // ─── Utility ─────────────────────────────────────────────────────────────
  backdrop: 'rgba(42,33,27,0.40)',
  shadow: '#2A211B',
} as const;

export type ThemeColors = {
  -readonly [K in keyof typeof LightColors]: string;
};

export const DarkColors: ThemeColors = {
  primary: '#B8692F',
  primaryDeep: '#E8B184',
  primaryLight: '#E0A066',
  primarySoft: '#33241A',
  primaryFaint: '#241A13',
  onPrimary: '#FFFFFF',

  background: '#12100E',
  surface: '#1C1917',
  surfaceAlt: '#26221E',
  border: '#3A332D',
  divider: '#2B2622',

  textPrimary: '#F4EDE6',
  textSecondary: '#C4B8AC',
  textMuted: '#8E8174',

  success: '#4ADE80',
  successSoft: 'rgba(74,222,128,0.16)',
  successFaint: 'rgba(74,222,128,0.08)',
  danger: '#F87171',
  dangerSoft: 'rgba(248,113,113,0.16)',
  dangerFaint: 'rgba(248,113,113,0.08)',

  gradientFrom: '#B8692F',
  gradientTo: '#8A4A1D',

  backdrop: 'rgba(0,0,0,0.60)',
  shadow: '#000000',
};

/** Backwards-compatible light palette (prefer `useTheme().colors`). */
export const Colors = LightColors;

export function paletteFor(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? DarkColors : LightColors;
}

/** Rounded corners used across the app. */
export const Radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
};

/** Spacing scale (multiples of 4). */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

/** Typography — Poppins (matching the web app) with system fallback. */
export const Fonts = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

export const FontSize = {
  xs: 12,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
};

/** Elevation shadows (iOS + Android). Static across themes. */
export const Shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  fab: {
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
};

export function getGradients(colors: ThemeColors) {
  return {
    brand: [colors.gradientFrom, colors.gradientTo] as const,
    brandSoft: [colors.primarySoft, colors.primaryFaint] as const,
  };
}

export const theme = { LightColors, DarkColors, Fonts, FontSize, Radius, Spacing, Shadows };

export default theme;
