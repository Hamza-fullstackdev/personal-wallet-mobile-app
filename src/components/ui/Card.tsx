import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { Colors, Radius, Shadows, Spacing } from '../../theme';

interface CardProps extends ViewProps {
  padded?: boolean;
  elevated?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export function Card({ padded = true, elevated = true, style, children, ...rest }: CardProps) {
  return (
    <View
      {...rest}
      style={[styles.card, padded && styles.padded, elevated && Shadows.card, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  padded: {
    padding: Spacing.lg,
  },
});

export default Card;
