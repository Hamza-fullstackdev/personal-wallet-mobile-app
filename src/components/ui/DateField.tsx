import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Shadows, Spacing, type ThemeColors } from '../../theme';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { formatDate } from '../../utils/format';
import AppText from './AppText';

interface DateFieldProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  style?: ViewStyle;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function initialPickerDate(
  value: Date | null,
  minimumDate?: Date,
  maximumDate?: Date,
): Date {
  const today = startOfDay(new Date());
  let next = startOfDay(value ?? today);
  if (minimumDate && next < startOfDay(minimumDate)) next = startOfDay(minimumDate);
  if (maximumDate && next > startOfDay(maximumDate)) next = startOfDay(maximumDate);
  return next;
}

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  minimumDate,
  maximumDate,
  icon = 'calendar-outline',
  style,
}: DateFieldProps) {
  const { colors, mode } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState<Date>(initialPickerDate(value, minimumDate, maximumDate));

  const openPicker = () => {
    setDraft(initialPickerDate(value, minimumDate, maximumDate));
    setShow(true);
  };

  const close = () => setShow(false);

  const clear = (event: GestureResponderEvent) => {
    event.stopPropagation();
    onChange(null);
  };

  const handleAndroidValueChange = (
    _event: DateTimePickerChangeEvent,
    date: Date,
  ) => {
    setShow(false);
    onChange(date);
  };

  const handleIosValueChange = (
    _event: DateTimePickerChangeEvent,
    date: Date,
  ) => {
    setDraft(date);
  };

  const displayValue = value ? formatDate(value) : placeholder;

  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${displayValue}` : displayValue}
        style={({ pressed }) => [
          styles.field,
          error ? styles.fieldError : null,
          pressed ? styles.fieldPressed : null,
          style,
        ]}
      >
        <AppText
          variant="body"
          weight="medium"
          color={value ? colors.textPrimary : colors.textMuted}
          style={styles.fieldText}
        >
          {displayValue}
        </AppText>

        <View style={styles.trailing}>
          {value ? (
            <Pressable
              onPress={clear}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear date"
              style={styles.clear}
            >
              <Ionicons name="close-circle" size={17} color={colors.textMuted} />
            </Pressable>
          ) : null}
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
      </Pressable>

      {error ? (
        <AppText variant="caption" color={colors.danger} style={styles.helper}>
          {error}
        </AppText>
      ) : null}

      {show && Platform.OS === 'android' ? (
        <DateTimePicker
          value={draft}
          mode="date"
          display="calendar"
          firstDayOfWeek={1}
          onValueChange={handleAndroidValueChange}
          onDismiss={close}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={show}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={close}
        >
          <Pressable style={styles.backdrop} onPress={close} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.xl }]}>
            <View style={styles.grabber} />
            <View style={styles.sheetHeader}>
              <Pressable onPress={close} hitSlop={8}>
                <AppText variant="body" color={colors.textSecondary}>
                  Cancel
                </AppText>
              </Pressable>
              <AppText variant="h3" numberOfLines={1} style={styles.sheetTitle}>
                {label ?? 'Select date'}
              </AppText>
              <Pressable
                onPress={() => {
                  onChange(draft);
                  close();
                }}
                hitSlop={8}
              >
                <AppText variant="body" weight="semiBold" color={colors.primary}>
                  Done
                </AppText>
              </Pressable>
            </View>
            <DateTimePicker
              value={draft}
              mode="date"
              display="spinner"
              onValueChange={handleIosValueChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              themeVariant={mode}
              textColor={colors.textPrimary}
              accentColor={colors.primary}
              style={styles.picker}
            />
          </View>
        </Modal>
      ) : null}
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
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      minHeight: 54,
      gap: Spacing.sm,
    },
    fieldPressed: { borderColor: colors.primaryLight, backgroundColor: colors.surface },
    fieldError: { borderColor: colors.danger },
    fieldText: {
      flex: 1,
      fontVariant: ['tabular-nums'],
      letterSpacing: 0.2,
    },
    trailing: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    clear: {
      width: 24,
      height: 24,
      borderRadius: Radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    helper: { marginTop: Spacing.xs },

    backdrop: { flex: 1, backgroundColor: colors.backdrop },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      maxHeight: '80%',
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
      marginBottom: Spacing.md,
    },
    sheetTitle: {
      flex: 1,
      marginHorizontal: Spacing.sm,
      textAlign: 'center',
    },
    picker: { alignSelf: 'stretch' },
  });

export default DateField;
