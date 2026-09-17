import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Colors, Radius, Spacing } from '../../theme';
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
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState<Date>(value ?? new Date());

  const openPicker = () => {
    setDraft(value ?? new Date());
    setShow(true);
  };

  const handleAndroidChange = (event: DateTimePickerEvent, date?: Date) => {
    setShow(false);
    if (event.type === 'set' && date) onChange(date);
  };

  const handleIosChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) setDraft(date);
  };

  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <Pressable
        onPress={openPicker}
        style={({ pressed }) => [
          styles.field,
          error ? styles.fieldError : null,
          pressed ? styles.fieldPressed : null,
          style,
        ]}
      >
        <Ionicons name={icon} size={18} color={Colors.primary} style={styles.leadIcon} />
        <AppText
          variant="body"
          color={value ? Colors.textPrimary : Colors.textMuted}
          style={styles.fieldText}
        >
          {value ? formatDate(value) : placeholder}
        </AppText>
        <View style={styles.icons}>
          {value ? (
            <Pressable onPress={() => onChange(null)} hitSlop={10} style={styles.clear}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </Pressable>

      {error ? (
        <AppText variant="caption" color={Colors.danger} style={styles.helper}>
          {error}
        </AppText>
      ) : null}

      {show && Platform.OS === 'android' ? (
        <DateTimePicker
          value={value ?? new Date()}
          mode="date"
          display="default"
          onChange={handleAndroidChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={show} transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <Pressable style={styles.backdrop} onPress={() => setShow(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Pressable onPress={() => setShow(false)} hitSlop={8}>
                <AppText variant="body" color={Colors.textSecondary}>
                  Cancel
                </AppText>
              </Pressable>
              <AppText variant="h3">{label ?? 'Pick a date'}</AppText>
              <Pressable
                onPress={() => {
                  onChange(draft);
                  setShow(false);
                }}
                hitSlop={8}
              >
                <AppText variant="body" weight="semiBold" color={Colors.primary}>
                  Done
                </AppText>
              </Pressable>
            </View>
            <DateTimePicker
              value={draft}
              mode="date"
              display="spinner"
              onChange={handleIosChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              themeVariant="light"
            />
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  label: { marginBottom: Spacing.sm },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 54,
  },
  fieldPressed: { borderColor: Colors.primaryLight },
  fieldError: { borderColor: Colors.danger },
  leadIcon: { marginRight: Spacing.md },
  fieldText: { flex: 1, marginRight: Spacing.sm },
  icons: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  clear: { padding: 2 },
  helper: { marginTop: Spacing.xs },
  backdrop: { flex: 1, backgroundColor: 'rgba(33, 29, 56, 0.4)' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
});

export default DateField;
