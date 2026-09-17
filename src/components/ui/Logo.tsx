import { Image, StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors, Spacing } from '../../theme';
import AppText from './AppText';

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  tagline?: string;
  style?: ViewStyle;
}

const LOGO = require('../../../assets/favicon-org.png');

export function Logo({ size = 72, showWordmark = true, tagline, style }: LogoProps) {
  return (
    <View style={[styles.container, style]}>
      <Image source={LOGO} style={{ width: size, height: size, borderRadius: size * 0.24 }} resizeMode="contain" />
      {showWordmark ? (
        <>
          <AppText variant="h2" center style={styles.wordmark}>
            Personal Wallet
          </AppText>
          {tagline ? (
            <AppText variant="caption" center style={styles.tagline}>
              {tagline}
            </AppText>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  wordmark: {
    marginTop: Spacing.lg,
    color: Colors.primaryDeep,
  },
  tagline: {
    marginTop: Spacing.xs,
    color: Colors.textSecondary,
  },
});

export default Logo;
