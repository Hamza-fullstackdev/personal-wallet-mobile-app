import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors, Radius, Spacing } from '../../theme';
import AppText from './AppText';

interface BannerProps {
  message: string;
  type?: 'error' | 'info' | 'success';
  style?: ViewStyle;
}

const TONES = {
  error: { icon: 'alert-circle' as const, color: Colors.danger, background: 'rgba(224,69,90,0.08)' },
  info: { icon: 'information-circle' as const, color: Colors.primary, background: Colors.primaryFaint },
  success: { icon: 'checkmark-circle' as const, color: Colors.primaryDeep, background: Colors.primarySoft },
};

export function Banner({ message, type = 'error', style }: BannerProps) {
  const tone = TONES[type];
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
