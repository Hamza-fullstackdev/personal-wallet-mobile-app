import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors, Fonts, FontSize, Gradients, Radius, Spacing } from '../../theme';
import AppText from './AppText';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'soft';
type Size = 'sm' | 'md' | 'lg';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IoniconName;
  iconRight?: IoniconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const HEIGHTS: Record<Size, number> = { sm: 42, md: 52, lg: 58 };
const TEXT_SIZE: Record<Size, number> = { sm: FontSize.sm, md: FontSize.md, lg: FontSize.lg };

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const height = HEIGHTS[size];
  const textColor =
    variant === 'primary'
      ? Colors.onPrimary
      : variant === 'danger'
        ? Colors.danger
        : Colors.primary;

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={textColor} style={styles.iconLeft} /> : null}
          <AppText
            weight="semiBold"
            color={textColor}
            style={{ fontSize: TEXT_SIZE[size] }}
            numberOfLines={1}
          >
            {title}
          </AppText>
          {iconRight ? (
            <Ionicons name={iconRight} size={18} color={textColor} style={styles.iconRight} />
          ) : null}
        </>
      )}
    </View>
  );

  const containerStyle: (ViewStyle | null)[] = [
    styles.base,
    { height, borderRadius: size === 'sm' ? Radius.md : Radius.lg },
    variant === 'outline' ? styles.outline : null,
    variant === 'ghost' ? styles.ghost : null,
    variant === 'soft' ? styles.soft : null,
    variant === 'danger' ? styles.danger : null,
    isDisabled ? styles.disabled : null,
    fullWidth ? styles.fullWidth : null,
    style as ViewStyle,
  ];

  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [containerStyle, pressed && !isDisabled ? styles.pressed : null]}
      >
        <LinearGradient
          colors={Gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, isDisabled ? styles.disabled : null]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [containerStyle, pressed && !isDisabled ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  gradient: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  soft: {
    backgroundColor: Colors.primarySoft,
  },
  danger: {
    backgroundColor: 'rgba(224,69,90,0.10)',
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.85,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});

export default Button;
