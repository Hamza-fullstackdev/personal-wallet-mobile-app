import { Image, StyleSheet, View, type ViewStyle } from 'react-native';

import { Spacing, type ThemeColors } from '../../theme';
import { useThemedStyles } from '../../theme/ThemeProvider';
import AppText from './AppText';

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  tagline?: string;
  style?: ViewStyle;
}

const LOGO = require('../../../assets/favicon-org.png');

export function Logo({ size = 72, showWordmark = true, tagline, style }: LogoProps) {
  const styles = useThemedStyles(createStyles);

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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    wordmark: {
      marginTop: Spacing.lg,
      color: colors.primaryDeep,
    },
    tagline: {
      marginTop: Spacing.xs,
      color: colors.textSecondary,
    },
  });

export default Logo;
