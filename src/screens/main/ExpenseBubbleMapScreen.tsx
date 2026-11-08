import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";

import { BubbleMap } from "../../components/charts";
import { useReceipt } from "../../components/receipt/ReceiptProvider";
import {
  AppText,
  Banner,
  Card,
  EmptyState,
  Loader,
  Screen,
} from "../../components/ui";
import { useExpenses } from "../../hooks/useExpenses";
import { useAuthStore } from "../../store/authStore";
import { Radius, Spacing, type ThemeColors } from "../../theme";
import { useTheme, useThemedStyles } from "../../theme/ThemeProvider";
import type { Expense } from "../../types";
import { chartPalette } from "../../utils/chartData";
import { formatAmount, formatDate } from "../../utils/format";
import { receiptFromExpense } from "../../utils/receipt";

type Period = "week" | "month" | "year";

const PERIODS: { label: string; value: Period }[] = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() - next.getDay());
  return next;
}

function startOfPeriod(date: Date, period: Period): Date {
  if (period === "week") return startOfWeek(date);
  if (period === "month")
    return new Date(date.getFullYear(), date.getMonth(), 1);
  return new Date(date.getFullYear(), 0, 1);
}

function compactAmount(value: number): string {
  if (value >= 1_000_000) {
    const scaled = value / 1_000_000;
    return `${scaled >= 10 ? Math.round(scaled) : scaled.toFixed(1)}m`;
  }
  if (value >= 1_000) {
    const scaled = value / 1_000;
    return `${scaled >= 10 ? Math.round(scaled) : scaled.toFixed(1)}k`;
  }
  return String(Math.round(value));
}

function categoryName(expense: Expense): string {
  return expense.category?.trim() || "Uncategorized";
}

export function ExpenseBubbleMapScreen() {
  const { openReceipt } = useReceipt();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const currency = useAuthStore((state) => state.user?.currency ?? "PKR");

  const [period, setPeriod] = useState<Period>("month");
  const [anchor, setAnchor] = useState(() =>
    startOfPeriod(new Date(), "month"),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const range = useMemo(() => {
    const start = new Date(anchor);
    start.setHours(0, 0, 0, 0);
    let end: Date;
    if (period === "week") end = addDays(start, 6);
    else if (period === "month")
      end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    else end = new Date(start.getFullYear(), 11, 31);
    end = new Date(end);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [period, anchor]);

  const filters = useMemo(
    () => ({
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString(),
    }),
    [range],
  );

  const { expenses, loading, refreshing, error, refetch } =
    useExpenses(filters);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const expenseList = useMemo(
    () =>
      expenses.filter(
        (expense) => expense.type !== "incoming" && expense.amount > 0,
      ),
    [expenses],
  );

  const palette = useMemo(() => chartPalette(colors), [colors]);

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    expenseList.forEach((expense) => {
      const name = categoryName(expense);
      map.set(name, (map.get(name) ?? 0) + expense.amount);
    });
    return Array.from(map, ([name, amount]) => ({ name, amount })).sort(
      (a, b) => b.amount - a.amount || a.name.localeCompare(b.name),
    );
  }, [expenseList]);

  const categoryColors = useMemo(() => {
    const names = Array.from(
      new Set(expenseList.map((expense) => categoryName(expense))),
    ).sort((a, b) => a.localeCompare(b));
    const map = new Map<string, string>();
    names.forEach((name, index) => {
      map.set(name, palette[index % palette.length]);
    });
    return map;
  }, [expenseList, palette]);

  const bubbleData = useMemo(
    () =>
      expenseList.map((expense) => ({
        id: expense.id,
        value: expense.amount,
        color: categoryColors.get(categoryName(expense)) ?? palette[0],
      })),
    [expenseList, categoryColors, palette],
  );

  const expenseById = useMemo(
    () => new Map(expenseList.map((expense) => [expense.id, expense])),
    [expenseList],
  );

  const totalSpent = useMemo(
    () => expenseList.reduce((sum, expense) => sum + expense.amount, 0),
    [expenseList],
  );

  const average = expenseList.length > 0 ? totalSpent / expenseList.length : 0;

  const largest = useMemo(() => {
    let result: Expense | null = null;
    for (const expense of expenseList) {
      if (!result || expense.amount > result.amount) result = expense;
    }
    return result;
  }, [expenseList]);

  const mapWidth = Math.max(1, width - Spacing.xl * 2 - 2);
  const mapHeight = Math.round(Math.min(500, Math.max(310, mapWidth * 1.05)));

  const rangeLabel = useMemo(() => {
    if (period === "week") {
      const startLabel = range.start.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      const endLabel = range.end.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `${startLabel} - ${endLabel}`;
    }
    if (period === "month") {
      return range.start.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    }
    return String(range.start.getFullYear());
  }, [period, range]);

  const changePeriod = (delta: number) => {
    setAnchor((previous) => {
      const base = new Date(previous);
      if (period === "week") return addDays(base, delta * 7);
      if (period === "month")
        return new Date(base.getFullYear(), base.getMonth() + delta, 1);
      return new Date(base.getFullYear() + delta, 0, 1);
    });
    setSelectedId(null);
  };

  const switchPeriod = (next: Period) => {
    if (next === period) return;
    setPeriod(next);
    setAnchor((previous) => startOfPeriod(previous, next));
    setSelectedId(null);
  };

  const goToToday = () => {
    setAnchor(startOfPeriod(new Date(), period));
    setSelectedId(null);
  };

  const openBubble = (id: string) => {
    const expense = expenseById.get(id);
    if (!expense) return;
    setSelectedId(id);
    openReceipt(receiptFromExpense(expense));
  };

  return (
    <Screen
      title='Bubble Map'
      icon='ellipse-outline'
      refreshing={refreshing}
      onRefresh={refetch}
    >
      <View style={styles.segment}>
        {PERIODS.map((item) => {
          const active = period === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => switchPeriod(item.value)}
              style={[
                styles.segmentItem,
                active ? styles.segmentItemActive : null,
              ]}
            >
              <AppText
                variant='caption'
                weight='semiBold'
                color={active ? colors.onPrimary : colors.textSecondary}
              >
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View style={styles.summaryText}>
            <AppText variant='caption'>Total spent</AppText>
            <AppText
              variant='h2'
              color={colors.danger}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {currency} {formatAmount(totalSpent, currency)}
            </AppText>
          </View>
          <View style={styles.summaryBadge}>
            <Ionicons name='ellipse' size={22} color={colors.primary} />
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryGridItem}>
            <AppText variant='caption'>Bubbles</AppText>
            <AppText variant='label'>{expenseList.length}</AppText>
          </View>
          <View style={styles.summaryGridItem}>
            <AppText variant='caption'>Categories</AppText>
            <AppText variant='label'>{categoryTotals.length}</AppText>
          </View>
          <View style={styles.summaryGridItem}>
            <AppText variant='caption'>Average</AppText>
            <AppText variant='label' numberOfLines={1} adjustsFontSizeToFit>
              {currency} {formatAmount(average, currency)}
            </AppText>
          </View>
        </View>

        {largest ? (
          <View style={styles.largestRow}>
            <Ionicons name='trending-up' size={16} color={colors.danger} />
            <AppText
              variant='caption'
              numberOfLines={1}
              style={styles.largestText}
            >
              Largest · {categoryName(largest)} · {formatDate(largest.date)}
            </AppText>
            <AppText variant='label' color={colors.danger}>
              {currency} {formatAmount(largest.amount, currency)}
            </AppText>
          </View>
        ) : null}
      </Card>

      {error ? <Banner message={error} type='error' /> : null}

      {expenseList.length === 0 ? (
        <EmptyState
          icon='ellipse-outline'
          title='No expense bubbles'
          message='Add an expense for this period, or switch to another week, month, or year.'
        />
      ) : (
        <>
          <Card padded={false} style={styles.mapCard}>
            <View style={styles.mapHeader}>
              <View style={styles.mapTitleWrap}>
                <AppText variant='h3'>Expense bubbles</AppText>
              </View>
              <View style={styles.navButtons}>
                <Pressable
                  onPress={() => changePeriod(-1)}
                  hitSlop={10}
                  style={styles.navButton}
                >
                  <Ionicons
                    name='chevron-back'
                    size={20}
                    color={colors.primaryDeep}
                  />
                </Pressable>
                <Pressable
                  onPress={() => changePeriod(1)}
                  hitSlop={10}
                  style={styles.navButton}
                >
                  <Ionicons
                    name='chevron-forward'
                    size={20}
                    color={colors.primaryDeep}
                  />
                </Pressable>
              </View>
            </View>

            <Pressable onPress={goToToday} hitSlop={6} style={styles.rangeRow}>
              <AppText variant='label' center>
                {rangeLabel}
              </AppText>
              <AppText variant='caption'>Tap to jump to today</AppText>
            </Pressable>

            <BubbleMap
              data={bubbleData}
              width={mapWidth}
              height={mapHeight}
              selectedId={selectedId}
              onPress={openBubble}
              formatValue={compactAmount}
            />

            <View style={styles.mapFooter}>
              <View style={styles.hintIcon}>
                <Ionicons
                  name='hand-left-outline'
                  size={18}
                  color={colors.primary}
                />
              </View>
              <AppText variant='caption' style={styles.hintText}>
                Tap any bubble to open its transaction details.
              </AppText>
            </View>
          </Card>

          <View style={styles.legendHeader}>
            <AppText variant='h3'>Categories</AppText>
            <AppText variant='caption'>
              {categoryTotals.length}{" "}
              {categoryTotals.length === 1 ? "category" : "categories"}
            </AppText>
          </View>

          <Card style={styles.legendCard}>
            {categoryTotals.map((category) => {
              const color = categoryColors.get(category.name) ?? palette[0];
              const percent =
                totalSpent > 0
                  ? Math.round((category.amount / totalSpent) * 100)
                  : 0;
              return (
                <View key={category.name} style={styles.categoryRow}>
                  <View
                    style={[styles.legendDot, { backgroundColor: color }]}
                  />
                  <AppText
                    variant='label'
                    numberOfLines={1}
                    style={styles.categoryName}
                  >
                    {category.name}
                  </AppText>
                  <AppText variant='caption' style={styles.categoryPercent}>
                    {percent}%
                  </AppText>
                  <AppText variant='label' numberOfLines={1}>
                    {currency} {formatAmount(category.amount, currency)}
                  </AppText>
                </View>
              );
            })}
          </Card>
        </>
      )}

      <Loader
        visible={loading && expenses.length === 0}
        message='Loading bubble map...'
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    segment: {
      flexDirection: "row",
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    segmentItem: {
      flex: 1,
      alignItems: "center",
      paddingVertical: Spacing.sm,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    segmentItemActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    summaryCard: { marginBottom: Spacing.lg },
    summaryTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    summaryText: { flex: 1, gap: 2 },
    summaryBadge: {
      width: 42,
      height: 42,
      borderRadius: Radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    summaryGrid: {
      flexDirection: "row",
      columnGap: Spacing.lg,
      rowGap: Spacing.md,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    summaryGridItem: { flex: 1, gap: 2, minWidth: 0 },
    largestRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    largestText: { flex: 1 },
    mapCard: { marginBottom: Spacing.lg },
    mapHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      padding: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    mapTitleWrap: { flex: 1 },
    navButtons: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    navButton: {
      width: 38,
      height: 38,
      borderRadius: Radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    rangeRow: {
      alignItems: "center",
      gap: 2,
      paddingBottom: Spacing.sm,
    },
    mapFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      padding: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    hintIcon: {
      width: 36,
      height: 36,
      borderRadius: Radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    hintText: { flex: 1 },
    legendHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.md,
    },
    legendCard: { gap: Spacing.md },
    categoryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: Radius.pill,
    },
    categoryName: { flex: 1 },
    categoryPercent: {
      minWidth: 40,
      textAlign: "right",
    },
  });

export default ExpenseBubbleMapScreen;
