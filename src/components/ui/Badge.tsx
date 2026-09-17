import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors, Radius, Spacing } from '../../theme';
import AppText from './AppText';

interface BadgeProps {
  label: string;
  /** Text/icon color. Defaults to primary. */
  color?: string;
  /** Background color. Defaults to soft purple. */
  background?: string;
  style?: ViewStyle;
}

export function Badge({ label, color = Colors.primary, background = Colors.primarySoft, style }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: background }, style]}>
      <AppText variant="caption" weight="semiBold" color={color}>
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
  | 'pending'
  | 'returned'
  | 'other';

const TONES: Record<BadgeTone, { color: string; background: string }> = {
  // All tones stay inside the white + purple brand, using purple depth only.
  incoming: { color: Colors.primaryDeep, background: Colors.primarySoft },
  outgoing: { color: Colors.onPrimary, background: Colors.primary },
  loan: { color: Colors.primary, background: Colors.primarySoft },
  return: { color: Colors.primaryDeep, background: Colors.primaryFaint },
  switch: { color: Colors.primary, background: Colors.primaryFaint },
  pending: { color: Colors.primary, background: Colors.primarySoft },
  returned: { color: Colors.primaryDeep, background: Colors.primaryFaint },
  other: { color: Colors.textSecondary, background: Colors.surfaceAlt },
};

interface ToneBadgeProps {
  label: string;
  tone: BadgeTone;
  style?: ViewStyle;
}

export function ToneBadge({ label, tone, style }: ToneBadgeProps) {
  const toneStyle = TONES[tone] ?? TONES.other;
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
