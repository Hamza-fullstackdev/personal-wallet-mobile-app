import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Radius, Spacing, type ThemeColors } from '../../theme';
import { useTheme } from '../../theme/ThemeProvider';
import AppText from './AppText';

interface BannerProps {
  message: string;
  type?: 'error' | 'info' | 'success';
  style?: ViewStyle;
}

export function Banner({ message, type = 'error', style }: BannerProps) {
  const { colors } = useTheme();

  const tones = {
    error: { icon: 'alert-circle' as const, color: colors.danger, background: colors.dangerFaint },
    info: { icon: 'information-circle' as const, color: colors.primary, background: colors.primaryFaint },
    success: { icon: 'checkmark-circle' as const, color: colors.success, background: colors.successFaint },
  };

  const tone = tones[type];
  return (
    <View style={[styles.banner, { backgroundColor: tone.background }, style]}>
      <Ionicons name={tone.icon} size={18} color={tone.color} />
      <AppText variant="caption" color={tone.color} style={styles.text}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  text: { flex: 1 },
});

export default Banner;
