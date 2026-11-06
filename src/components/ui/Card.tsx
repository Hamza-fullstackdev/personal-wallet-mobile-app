import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { Radius, Shadows, Spacing, type ThemeColors } from '../../theme';
import { useThemedStyles } from '../../theme/ThemeProvider';

interface CardProps extends ViewProps {
  padded?: boolean;
  elevated?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export function Card({ padded = true, elevated = true, style, children, ...rest }: CardProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View
      {...rest}
      style={[styles.card, padded && styles.padded, elevated && Shadows.card, style]}
    >
      {children}
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    padded: {
      padding: Spacing.lg,
    },
  });

export default Card;
