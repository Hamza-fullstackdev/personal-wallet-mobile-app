import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

import { Radius, Shadows, Spacing, type ThemeColors } from "../../theme";
import { useTheme, useThemedStyles } from "../../theme/ThemeProvider";
import type { ReceiptData } from "../../types";
import { formatCurrency, formatDateTime } from "../../utils/format";
import { AppText, Button, ToneBadge, type BadgeTone } from "../ui";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

const TYPE_TONES: Record<string, BadgeTone> = {
  incoming: "incoming",
  outgoing: "outgoing",
  loan: "loan",
  return: "return",
  switch: "switch",
  investment: "investment",
};

function receiptTone(type: string): BadgeTone {
  return TYPE_TONES[type] ?? "other";
}

function amountLabel(receipt: ReceiptData): string {
  if (receipt.type === "investment") return "Amount invested";
  if (receipt.type === "loan") return "Loan given";
  if (receipt.type === "return") return "Loan returned";
  if (receipt.direction === "in") return "Amount received";
  if (receipt.direction === "out") return "Amount paid";
  return "Amount transferred";
}

interface ReceiptModalProps {
  visible: boolean;
  receipt: ReceiptData | null;
  currency?: string;
  onClose: () => void;
}

export function ReceiptModal({
  visible,
  receipt,
  currency = "PKR",
  onClose,
}: ReceiptModalProps) {
  const { colors, gradients } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const receiptRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [saving, setSaving] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const handleSave = async () => {
    if (!receipt || saving) return;

    setSaving(true);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(true, [
        "photo",
      ]);
      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Allow photo access to save this receipt to your gallery.",
        );
        return;
      }

      if (!receiptRef.current) return;

      setCapturing(true);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const uri = await captureRef(receiptRef.current, {
        format: "png",
        quality: 1,
        result: "tmpfile",
        snapshotContentContainer: true,
      });

      await MediaLibrary.Asset.create(uri);
      Alert.alert("Saved", "Receipt saved to your gallery.");
    } catch (error) {
      Alert.alert(
        "Unable to save",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setCapturing(false);
      setSaving(false);
    }
  };

  const amountColor =
    receipt?.direction === "in"
      ? colors.success
      : receipt?.direction === "out"
        ? colors.danger
        : colors.primary;
  const sign =
    receipt?.direction === "in" ? "+" : receipt?.direction === "out" ? "-" : "";

  return (
    <Modal
      transparent
      visible={visible}
      animationType='fade'
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            Shadows.card,
            { paddingBottom: Math.max(insets.bottom, Spacing.xl) },
          ]}
        >
          <View style={styles.handle} />

          {receipt ? (
            <ScrollView
              ref={receiptRef}
              style={styles.scroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              <View style={styles.header}>
                <View style={styles.brandRow}>
                  <LinearGradient
                    colors={gradients.brand}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.logo}
                  >
                    <Ionicons
                      name='wallet'
                      size={20}
                      color={colors.onPrimary}
                    />
                  </LinearGradient>
                  <View style={styles.brandText}>
                    <AppText variant='h2'>Personal Wallet</AppText>
                    <AppText variant='caption'>Transaction receipt</AppText>
                  </View>
                  {capturing ? null : (
                    <Pressable
                      onPress={onClose}
                      hitSlop={8}
                      style={styles.closeButton}
                    >
                      <Ionicons
                        name='close'
                        size={20}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  )}
                </View>

                <View style={styles.receiptMetaRow}>
                  <ToneBadge
                    label={receipt.typeLabel}
                    tone={receiptTone(receipt.type)}
                  />
                  <AppText variant='caption' style={styles.reference}>
                    {receipt.reference}
                  </AppText>
                </View>
              </View>

              <View style={styles.dashed} />

              <View style={styles.amountBlock}>
                <AppText variant='caption'>{amountLabel(receipt)}</AppText>
                <AppText
                  variant='display'
                  color={amountColor}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {sign} {formatCurrency(receipt.amount, currency)}
                </AppText>
                {receipt.title ? (
                  <AppText variant='label' center>
                    {receipt.title}
                  </AppText>
                ) : null}
              </View>

              <View style={styles.dashed} />

              <View style={styles.details}>
                <DetailRow
                  icon='pricetag-outline'
                  label='Type'
                  value={receipt.typeLabel}
                />
                <DetailRow
                  icon='calendar-outline'
                  label='Date & time'
                  value={formatDateTime(receipt.date)}
                />
                {receipt.description ? (
                  <DetailRow
                    icon='document-text-outline'
                    label={receipt.descriptionLabel ?? 'Details'}
                    value={receipt.description}
                  />
                ) : null}
                {receipt.runningBalance !== undefined ? (
                  <DetailRow
                    icon='wallet-outline'
                    label='Balance after'
                    value={formatCurrency(receipt.runningBalance, currency)}
                  />
                ) : null}
                <DetailRow
                  icon='barcode-outline'
                  label='Reference'
                  value={receipt.reference}
                />
              </View>

              <View style={styles.dashed} />

              <View style={styles.statusRow}>
                <Ionicons
                  name='checkmark-circle'
                  size={18}
                  color={colors.success}
                />
                <AppText variant='caption'>Recorded successfully</AppText>
              </View>
              <AppText variant='caption' center style={styles.thanks}>
                Thank you for using Personal Wallet
              </AppText>
            </ScrollView>
          ) : null}

          <View style={styles.actions}>
            <Button
              title='Save'
              icon='download-outline'
              loading={saving}
              fullWidth={false}
              onPress={handleSave}
              style={styles.actionButton}
            />
            <Button
              title='Close'
              variant='soft'
              icon='close'
              disabled={saving}
              fullWidth={false}
              onPress={onClose}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: IoniconName;
  label: string;
  value: string;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={14} color={colors.primary} />
      </View>
      <AppText variant='caption' style={styles.detailLabel}>
        {label}
      </AppText>
      <AppText
        variant='label'
        color={colors.textPrimary}
        style={styles.detailValue}
      >
        {value}
      </AppText>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: colors.backdrop,
    },
    backdrop: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    sheet: {
      width: "100%",
      maxHeight: "92%",
      backgroundColor: colors.surface,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      paddingTop: Spacing.md,
      gap: Spacing.lg,
      overflow: "hidden",
    },
    handle: {
      alignSelf: "center",
      width: 44,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: Spacing.xs,
    },
    scroll: {
      flexShrink: 1,
    },
    content: {
      gap: Spacing.sm,
      paddingHorizontal: Spacing.xxl,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.surface,
    },
    actions: {
      flexDirection: "row",
      gap: Spacing.md,
      paddingHorizontal: Spacing.xxl,
    },
    actionButton: {
      flex: 1,
    },
    header: {
      gap: Spacing.md,
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    logo: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    brandText: {
      flex: 1,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: Radius.md,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    receiptMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.sm,
    },
    reference: {
      letterSpacing: 1,
    },
    dashed: {
      borderBottomWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.border,
      marginVertical: Spacing.xs,
    },
    amountBlock: {
      alignItems: "center",
      gap: Spacing.xs,
      paddingVertical: Spacing.sm,
    },
    details: {
      gap: 2,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.sm,
      paddingVertical: Spacing.xs + 1,
    },
    detailIcon: {
      width: 24,
      height: 24,
      borderRadius: Radius.sm,
      backgroundColor: colors.primaryFaint,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 1,
    },
    detailLabel: {
      width: 88,
      marginTop: 3,
    },
    detailValue: {
      flex: 1,
      marginTop: 2,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
    },
    thanks: {
      marginTop: Spacing.xs,
    },
  });

export default ReceiptModal;
