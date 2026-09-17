/**
 * THEME — Single source of truth for the app's look.
 *
 * BRAND RULE: the app uses exactly two core colors —
 *   - WHITE  (background / surfaces)
 *   - PURPLE (primary / brand)
 *
 * Every tint below is derived from those two tones (purple ramps + neutral
 * purples). If you ever want to rebrand, change the values in `Colors` below —
 * every screen and component reads from here, nothing else needs touching.
 */

export const Colors = {
  // ─── Brand purple ────────────────────────────────────────────────────────
  /** Main primary color used for buttons, accents, active states. */
  primary: '#524FFE',
  /** Deep purple — gradient partner & pressed states, very dark text accents. */
  primaryDeep: '#3A287A',
  /** Slightly lighter purple for hovers / secondary accents. */
  primaryLight: '#7C74FF',
  /** Soft purple tint for badges, tags, and icon chips. */
  primarySoft: '#EDECFF',
  /** Very light purple for section fills and subtle backgrounds. */
  primaryFaint: '#F6F5FF',
  /** Text / icons sitting on top of primary. */
  onPrimary: '#FFFFFF',

  // ─── White surfaces ──────────────────────────────────────────────────────
  /** App background — stays white per brand rule. */
  background: '#FFFFFF',
  /** Card / surface backgrounds. */
  surface: '#FFFFFF',
  /** Slightly off-white for alternate rows & input fills. */
  surfaceAlt: '#F8F7FD',
  /** Borders around inputs & cards. */
  border: '#E7E4F7',
  /** Hairline dividers. */
  divider: '#F0EEFA',

  // ─── Text (purple-tinted neutrals) ───────────────────────────────────────
  textPrimary: '#211D38',
  textSecondary: '#6C6883',
  textMuted: '#A09CB6',

  // ─── Semantic / status (single-changeable utility colors) ───────────────
  /** Positive / money-in accent. */
  success: '#4E78F7',
  /** Negative / money-out accent. */
  danger: '#E0455A',
};

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

/** Elevation shadows (iOS + Android). */
export const Shadows = {
  card: {
    shadowColor: '#3A287A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  fab: {
    shadowColor: '#3A287A',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
};

/** The brand gradient (left → right) used on primary buttons & hero cards. */
export const Gradients = {
  brand: [Colors.primary, Colors.primaryDeep] as const,
  brandSoft: [Colors.primarySoft, Colors.primaryFaint] as const,
};

export const theme = { Colors, Fonts, FontSize, Radius, Spacing, Shadows, Gradients };

export default theme;