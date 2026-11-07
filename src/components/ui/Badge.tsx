import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Radius, Spacing, type ThemeColors } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';
import AppText from './AppText';

interface BadgeProps {
  label: string;
  /** Text/icon color. Defaults to the brand accent. */
  color?: string;
  /** Background color. Defaults to the soft brand tint. */
  background?: string;
  style?: ViewStyle;
}

export function Badge({ label, color, background, style }: BadgeProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: background ?? colors.primarySoft }, style]}>
      <AppText variant="caption" weight="semiBold" color={color ?? colors.primary}>
        {label}
      </AppText>
    </View>
  );
}

export type BadgeTone =
  | 'incoming'
  | 'outgoing'
  | 'loan'
  | 'return'
  | 'switch'
  | 'investment'
  | 'pending'
  | 'returned'
  | 'other';

function toneStyles(colors: ThemeColors): Record<BadgeTone, { color: string; background: string }> {
  return {
    // Money in is green, money out is red, transfers stay brand-neutral.
    incoming: { color: colors.success, background: colors.successSoft },
    outgoing: { color: colors.danger, background: colors.dangerSoft },
    loan: { color: colors.danger, background: colors.dangerSoft },
    return: { color: colors.success, background: colors.successSoft },
    switch: { color: colors.primary, background: colors.primaryFaint },
    investment: { color: colors.primary, background: colors.primarySoft },
    pending: { color: colors.primary, background: colors.primarySoft },
    returned: { color: colors.success, background: colors.successFaint },
    other: { color: colors.textSecondary, background: colors.surfaceAlt },
  };
}

interface ToneBadgeProps {
  label: string;
  tone: BadgeTone;
  style?: ViewStyle;
}

export function ToneBadge({ label, tone, style }: ToneBadgeProps) {
  const { colors } = useTheme();
  const tones = toneStyles(colors);
  const toneStyle = tones[tone] ?? tones.other;
  return <Badge label={label} color={toneStyle.color} background={toneStyle.background} style={style} />;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radius.pill,
  },
});

export default Badge;
