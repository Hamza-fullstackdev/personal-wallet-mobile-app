import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { Colors, Fonts, FontSize, Radius, Spacing } from '../../theme';
import AppText from './AppText';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  /** Icon rendered inside the field, on the left. */
  leftIcon?: IoniconName;
  /** Icon rendered inside the field, on the right. */
  rightIcon?: IoniconName;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  onFocus,
  onBlur,
  secureTextEntry,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const focusAnim = useRef(new Animated.Value(0)).current;

  const isPassword = Boolean(secureTextEntry);
  const showToggle = isPassword && !rightIcon;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 160,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [focused, focusAnim]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? Colors.danger : Colors.border, error ? Colors.danger : Colors.primary],
  });
  const backgroundColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.surfaceAlt, Colors.surface],
  });

  const iconColor = focused ? Colors.primary : Colors.textMuted;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <Animated.View
        style={[
          styles.field,
          rest.multiline ? styles.fieldMultiline : null,
          { borderColor, backgroundColor },
        ]}
      >
        {leftIcon ? (
          <Ionicons name={leftIcon} size={18} color={iconColor} style={styles.leftIcon} />
        ) : null}

        <TextInput
          {...rest}
          secureTextEntry={isPassword ? hidden : secureTextEntry}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          placeholderTextColor={Colors.textMuted}
          style={[styles.input, rest.multiline ? styles.multiline : null, style]}
        />

        {showToggle ? (
          <Pressable onPress={() => setHidden((value) => !value)} hitSlop={10} style={styles.rightIcon}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
          </Pressable>
        ) : rightIcon ? (
          <Pressable
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            hitSlop={10}
            style={styles.rightIcon}
          >
            <Ionicons name={rightIcon} size={18} color={iconColor} />
          </Pressable>
        ) : null}
      </Animated.View>

      {error ? (
        <AppText variant="caption" color={Colors.danger} style={styles.helper}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" style={styles.helper}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

export const inputStyles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
    justifyContent: 'center',
  },
  fieldFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
});

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    marginBottom: Spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 54,
  },
  fieldMultiline: {
    alignItems: 'flex-start',
    paddingVertical: Spacing.xs,
  },
  leftIcon: {
    marginRight: Spacing.md,
  },
  rightIcon: {
    marginLeft: Spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    fontFamily: Fonts.regular,
    color: Colors.textPrimary,
  },
  multiline: {
    minHeight: 92,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  helper: {
    marginTop: Spacing.xs,
  },
});

export default Input;
