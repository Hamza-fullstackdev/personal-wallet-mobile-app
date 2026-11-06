import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Shadows, Spacing, type ThemeColors } from '../../theme';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import AppText from './AppText';

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
  allowClear?: boolean;
  sheetTitle?: string;
  icon?: IoniconName;
  style?: ViewStyle;
}

export function Select({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onChange,
  disabled,
  error,
  allowClear,
  sheetTitle,
  icon,
  style,
}: SelectProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const selected = useMemo(() => options.find((option) => option.value === value), [options, value]);

  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <Pressable
        onPress={() => !disabled && setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          disabled ? styles.disabled : null,
          error ? styles.fieldError : null,
          pressed && !disabled ? styles.fieldPressed : null,
          style,
        ]}
      >
        {icon ? <Ionicons name={icon} size={18} color={colors.primary} style={styles.fieldIcon} /> : null}
        <AppText
          variant="body"
          color={selected ? colors.textPrimary : colors.textMuted}
          numberOfLines={1}
          style={styles.fieldText}
        >
          {selected ? selected.label : placeholder}
        </AppText>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      {error ? (
        <AppText variant="caption" color={colors.danger} style={styles.helper}>
          {error}
        </AppText>
      ) : null}

      <Modal visible={open} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.grabber} />
          <View style={styles.sheetHeader}>
            <AppText variant="h3">{sheetTitle ?? label ?? 'Select'}</AppText>
            <Pressable onPress={() => setOpen(false)} hitSlop={10} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
            {allowClear ? (
              <Pressable
                onPress={() => {
                  onChange('');
                  setOpen(false);
                }}
                style={styles.option}
              >
                <AppText variant="body" color={colors.textMuted}>
                  None
                </AppText>
              </Pressable>
            ) : null}

            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  style={[styles.option, isSelected ? styles.optionSelected : null]}
                >
                  <View style={styles.optionTextWrap}>
                    <AppText variant="body" weight={isSelected ? 'semiBold' : 'regular'}>
                      {option.label}
                    </AppText>
                    {option.description ? (
                      <AppText variant="caption" style={styles.optionDescription}>
                        {option.description}
                      </AppText>
                    ) : null}
                  </View>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}

            {options.length === 0 ? (
              <AppText variant="caption" center style={styles.noOptions}>
                No options available
              </AppText>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: { width: '100%' },
    label: { marginBottom: Spacing.sm },
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.lg,
      minHeight: 54,
    },
    fieldPressed: { borderColor: colors.primaryLight },
    fieldError: { borderColor: colors.danger },
    disabled: { opacity: 0.55 },
    fieldIcon: { marginRight: Spacing.md },
    fieldText: { flex: 1, marginRight: Spacing.sm },
    helper: { marginTop: Spacing.xs },

    backdrop: { flex: 1, backgroundColor: colors.backdrop },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      maxHeight: '70%',
      ...Shadows.card,
    },
    grabber: {
      alignSelf: 'center',
      width: 44,
      height: 5,
      borderRadius: Radius.pill,
      backgroundColor: colors.border,
      marginBottom: Spacing.md,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: Radius.pill,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetList: { marginTop: Spacing.xs },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.md,
      borderRadius: Radius.md,
      marginBottom: Spacing.xs,
    },
    optionSelected: { backgroundColor: colors.primarySoft },
    optionTextWrap: { flex: 1, marginRight: Spacing.md },
    optionDescription: { marginTop: 2 },
    noOptions: { paddingVertical: Spacing.xl },
  });

export default Select;
