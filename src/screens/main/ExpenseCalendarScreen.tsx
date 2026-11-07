import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  AppText,
  Banner,
  Card,
  EmptyState,
  Loader,
  Screen,
} from "../../components/ui";
import { useReceipt } from "../../components/receipt/ReceiptProvider";
import { useExpenses } from "../../hooks/useExpenses";
import { useAuthStore } from "../../store/authStore";
import { Radius, Spacing, type ThemeColors } from "../../theme";
import { useTheme, useThemedStyles } from "../../theme/ThemeProvider";
import type { ExpenseType } from "../../types";
import {
  formatAmount,
  formatDate,
  formatDateTime,
  toISODate,
} from "../../utils/format";
import { receiptFromExpense } from "../../utils/receipt";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
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

function isIncome(type: ExpenseType): boolean {
  return type === "incoming";
}

export function ExpenseCalendarScreen() {
  const { openReceipt } = useReceipt();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const currency = useAuthStore((state) => state.user?.currency ?? "PKR");

  const [month, setMonth] = useState(() => new Date());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const monthStart = useMemo(
    () => new Date(month.getFullYear(), month.getMonth(), 1, 0, 0, 0, 0),
    [month],
  );
  const monthEnd = useMemo(
    () =>
      new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999),
    [month],
  );

  const filters = useMemo(
    () => ({
      startDate: monthStart.toISOString(),
      endDate: monthEnd.toISOString(),
    }),
    [monthStart, monthEnd],
  );

  const { expenses, loading, refreshing, error, refetch } =
    useExpenses(filters);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const dailyTotals = useMemo(() => {
    const map = new Map<string, { spent: number; received: number }>();
    expenses.forEach((expense) => {
      const key = toISODate(new Date(expense.date));
      const current = map.get(key) ?? { spent: 0, received: 0 };
      if (isIncome(expense.type)) {
        current.received += expense.amount;
      } else {
        current.spent += expense.amount;
      }
      map.set(key, current);
    });
    return map;
  }, [expenses]);

  const { totalSpent, totalReceived, spendDays } = useMemo(() => {
    let spent = 0;
    let received = 0;
    let days = 0;
    dailyTotals.forEach((value) => {
      spent += value.spent;
      received += value.received;
      if (value.spent > 0) days += 1;
    });
    return { totalSpent: spent, totalReceived: received, spendDays: days };
  }, [dailyTotals]);

  const net = totalReceived - totalSpent;
  const averagePerDay = spendDays > 0 ? totalSpent / spendDays : 0;

  const investmentTotal = useMemo(
    () =>
      expenses
        .filter((expense) => expense.type === "investment")
        .reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );
  const outgoingTotal = totalSpent - investmentTotal;

  const { maxSpent, highestKey } = useMemo(() => {
    let max = 0;
    let key: string | null = null;
    dailyTotals.forEach((value, dayKey) => {
      if (value.spent > max) {
        max = value.spent;
        key = dayKey;
      }
    });
    return { maxSpent: max, highestKey: key as string | null };
  }, [dailyTotals]);

  const expensiveKeys = useMemo(() => {
    const set = new Set<string>();
    const threshold = averagePerDay * 1.5;
    dailyTotals.forEach((value, key) => {
      if (value.spent > 0 && value.spent >= threshold) set.add(key);
    });
    if (set.size === 0 && highestKey && maxSpent > 0) set.add(highestKey);
    return set;
  }, [dailyTotals, averagePerDay, highestKey, maxSpent]);

  const weeks = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [month]);

  const todayKey = toISODate(new Date());
  const monthLabel = month.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const changeMonth = (delta: number) => {
    setMonth(
      (previous) =>
        new Date(previous.getFullYear(), previous.getMonth() + delta, 1),
    );
    setSelectedKey(null);
  };

  const goToToday = () => {
    setMonth(new Date());
    setSelectedKey(null);
  };

  const toggleDay = (key: string) => {
    setSelectedKey((previous) => (previous === key ? null : key));
  };

  const entryMeta = (type: ExpenseType) => {
    if (type === "incoming") {
      return {
        label: "Income",
        icon: "arrow-down-circle" as const,
        fg: colors.success,
        bg: colors.successSoft,
      };
    }
    if (type === "investment") {
      return {
        label: "Investment",
        icon: "trending-up" as const,
        fg: colors.primary,
        bg: colors.primarySoft,
      };
    }
    return {
      label: "Expense",
      icon: "arrow-up-circle" as const,
      fg: colors.danger,
      bg: colors.dangerSoft,
    };
  };

  const visibleExpenses = useMemo(() => {
    const source = selectedKey
      ? expenses.filter(
          (expense) => toISODate(new Date(expense.date)) === selectedKey,
        )
      : expenses;
    return [...source].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [expenses, selectedKey]);

  const visibleTotals = useMemo(() => {
    let spent = 0;
    let received = 0;
    visibleExpenses.forEach((expense) => {
      if (isIncome(expense.type)) {
        received += expense.amount;
      } else {
        spent += expense.amount;
      }
    });
    return { spent, received };
  }, [visibleExpenses]);

  return (
    <Screen
      title='Expense Calendar'
      icon='calendar-outline'
      refreshing={refreshing}
      onRefresh={refetch}
    >
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <AppText variant='caption'>Total spent</AppText>
            <AppText variant='h3' color={colors.danger}>
              {currency} {formatAmount(totalSpent, currency)}
            </AppText>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <AppText variant='caption'>Total income</AppText>
            <AppText variant='h3' color={colors.success}>
              {currency} {formatAmount(totalReceived, currency)}
            </AppText>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryGridItem}>
            <AppText variant='caption'>Outgoing</AppText>
            <AppText variant='label' color={colors.danger}>
              {currency} {formatAmount(outgoingTotal, currency)}
            </AppText>
          </View>
          <View style={styles.summaryGridItem}>
            <AppText variant='caption'>Todo investments</AppText>
            <AppText variant='label' color={colors.primary}>
              {currency} {formatAmount(investmentTotal, currency)}
            </AppText>
          </View>
          <View style={styles.summaryGridItem}>
            <AppText variant='caption'>Net balance</AppText>
            <AppText
              variant='label'
              color={net >= 0 ? colors.success : colors.danger}
            >
              {net >= 0 ? "+" : "-"} {currency}{" "}
              {formatAmount(Math.abs(net), currency)}
            </AppText>
          </View>
          <View style={styles.summaryGridItem}>
            <AppText variant='caption'>Daily avg spend</AppText>
            <AppText variant='label'>
              {currency} {formatAmount(averagePerDay, currency)}
            </AppText>
          </View>
        </View>

        {highestKey ? (
          <View style={styles.highestRow}>
            <Ionicons name='trending-up' size={16} color={colors.danger} />
            <AppText variant='caption' style={styles.highestText}>
              Highest spend on {formatDate(parseDateKey(highestKey))}
            </AppText>
            <AppText variant='label' color={colors.danger}>
              {currency} {formatAmount(maxSpent, currency)}
            </AppText>
          </View>
        ) : null}
      </Card>

      {error ? <Banner message={error} type='error' /> : null}

      <Card style={styles.calendarCard}>
        <View style={styles.monthHeader}>
          <Pressable
            onPress={() => changeMonth(-1)}
            hitSlop={10}
            style={styles.monthButton}
          >
            <Ionicons
              name='chevron-back'
              size={20}
              color={colors.primaryDeep}
            />
          </Pressable>
          <Pressable onPress={goToToday} hitSlop={8}>
            <AppText variant='h3'>{monthLabel}</AppText>
          </Pressable>
          <Pressable
            onPress={() => changeMonth(1)}
            hitSlop={10}
            style={styles.monthButton}
          >
            <Ionicons
              name='chevron-forward'
              size={20}
              color={colors.primaryDeep}
            />
          </Pressable>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((label, index) => (
            <View key={`${label}-${index}`} style={styles.weekdayCell}>
              <AppText variant='caption' center>
                {label}
              </AppText>
            </View>
          ))}
        </View>

        {weeks.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              if (!day) {
                return (
                  <View
                    key={`empty-${weekIndex}-${dayIndex}`}
                    style={styles.dayCell}
                  />
                );
              }

              const date = new Date(month.getFullYear(), month.getMonth(), day);
              const key = toISODate(date);
              const totals = dailyTotals.get(key);
              const spent = totals?.spent ?? 0;
              const received = totals?.received ?? 0;
              const isExpensive = expensiveKeys.has(key);
              const isSelected = selectedKey === key;
              const isToday = key === todayKey;

              const dayColor = isSelected
                ? colors.primaryDeep
                : spent > 0
                  ? colors.danger
                  : received > 0
                    ? colors.success
                    : colors.textPrimary;

              return (
                <Pressable
                  key={key}
                  onPress={() => toggleDay(key)}
                  style={[
                    styles.dayCell,
                    isToday ? styles.dayCellToday : null,
                    spent > 0
                      ? isExpensive
                        ? styles.dayCellExpensive
                        : styles.dayCellActive
                      : received > 0
                        ? styles.dayCellIncome
                        : null,
                    isSelected ? styles.dayCellSelected : null,
                  ]}
                >
                  <AppText
                    variant='caption'
                    weight={isExpensive || isSelected ? "semiBold" : "regular"}
                    color={dayColor}
                    style={styles.dayNumber}
                  >
                    {day}
                  </AppText>
                  {spent > 0 ? (
                    <AppText
                      variant='caption'
                      weight={isExpensive ? "semiBold" : "regular"}
                      color={colors.danger}
                      style={styles.dayAmount}
                    >
                      -{compactAmount(spent)}
                    </AppText>
                  ) : null}
                  {received > 0 ? (
                    <AppText
                      variant='caption'
                      weight='semiBold'
                      color={colors.success}
                      style={styles.dayAmount}
                    >
                      +{compactAmount(received)}
                    </AppText>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: colors.danger }]}
            />
            <AppText variant='caption'>Spent</AppText>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: colors.success }]}
            />
            <AppText variant='caption'>Income</AppText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, styles.dayCellExpensive]} />
            <AppText variant='caption'>High spend</AppText>
          </View>
        </View>
        <AppText variant='caption' style={styles.legendHint}>
          Tap a day to filter
        </AppText>
      </Card>

      <View style={styles.listHeader}>
        <View style={styles.listHeaderText}>
          <AppText variant='h3'>
            {selectedKey
              ? formatDate(parseDateKey(selectedKey))
              : "All month activity"}
          </AppText>
          <AppText variant='caption'>
            {visibleExpenses.length}{" "}
            {visibleExpenses.length === 1 ? "entry" : "entries"}
          </AppText>
          <View style={styles.listTotalsRow}>
            <AppText variant='caption' color={colors.danger}>
              Spent {currency} {formatAmount(visibleTotals.spent, currency)}
            </AppText>
            {visibleTotals.received > 0 ? (
              <AppText variant='caption' color={colors.success}>
                Income {currency}{" "}
                {formatAmount(visibleTotals.received, currency)}
              </AppText>
            ) : null}
          </View>
        </View>
        {selectedKey ? (
          <Pressable onPress={() => setSelectedKey(null)} hitSlop={8}>
            <AppText variant='label' color={colors.primary}>
              Show all
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {!loading && visibleExpenses.length === 0 ? (
        <EmptyState
          icon='calendar-outline'
          title={
            selectedKey ? "No activity on this day" : "No activity this month"
          }
          message='Expenses, todo investments, and incoming balance will appear here.'
        />
      ) : null}

      <View style={styles.list}>
        {visibleExpenses.map((expense) => {
          const meta = entryMeta(expense.type);
          const income = isIncome(expense.type);
          return (
            <Pressable
              key={expense.id}
              onPress={() => openReceipt(receiptFromExpense(expense))}
              style={({ pressed }) => (pressed ? styles.expensePressed : null)}
            >
              <Card style={styles.expenseCard}>
                <View style={styles.expenseRow}>
                  <View
                    style={[styles.expenseIcon, { backgroundColor: meta.bg }]}
                  >
                    <Ionicons name={meta.icon} size={18} color={meta.fg} />
                  </View>
                  <View style={styles.expenseInfo}>
                    <View style={styles.expenseTopRow}>
                      <AppText
                        variant='label'
                        numberOfLines={1}
                        style={styles.expenseCategory}
                      >
                        {expense.category}
                      </AppText>
                    </View>
                    <AppText
                      variant='caption'
                      numberOfLines={1}
                      style={styles.expenseDescription}
                    >
                      {expense.description}
                    </AppText>
                  </View>
                  <View style={styles.expenseAmountWrap}>
                    <AppText variant='amount' color={meta.fg} numberOfLines={1}>
                      {income ? "+" : "-"} {currency}{" "}
                      {formatAmount(expense.amount, currency)}
                    </AppText>
                    <View style={styles.expenseMetaRow}>
                      <AppText variant='caption'>
                        {formatDateTime(expense.date)}
                      </AppText>
                      <Ionicons
                        name='chevron-forward'
                        size={13}
                        color={colors.textMuted}
                      />
                    </View>
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <Loader
        visible={loading && expenses.length === 0}
        message='Loading activity...'
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    summaryCard: { marginBottom: Spacing.lg },
    summaryRow: { flexDirection: "row", alignItems: "center" },
    summaryItem: { flex: 1, gap: 2 },
    summaryDivider: {
      width: 1,
      alignSelf: "stretch",
      backgroundColor: colors.divider,
      marginHorizontal: Spacing.md,
    },
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      columnGap: Spacing.lg,
      rowGap: Spacing.md,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    summaryGridItem: { flexBasis: "46%", flexGrow: 1, gap: 2 },
    highestRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    highestText: { flex: 1 },
    calendarCard: { marginBottom: Spacing.lg },
    monthHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.lg,
    },
    monthButton: {
      width: 38,
      height: 38,
      borderRadius: Radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    weekdayRow: { flexDirection: "row", marginBottom: Spacing.xs },
    weekdayCell: { flex: 1, alignItems: "center" },
    weekRow: { flexDirection: "row" },
    dayCell: {
      flex: 1,
      minHeight: 44,
      margin: 2,
      borderRadius: Radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    dayCellToday: { borderWidth: 1, borderColor: colors.primaryLight },
    dayCellActive: { backgroundColor: colors.dangerFaint },
    dayCellIncome: { backgroundColor: colors.successFaint },
    dayCellExpensive: {
      backgroundColor: colors.dangerSoft,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    dayCellSelected: { borderWidth: 2, borderColor: colors.primary },
    dayNumber: { fontSize: 10, lineHeight: 12 },
    dayAmount: { fontSize: 8, lineHeight: 10 },
    legend: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: Spacing.md,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    legendItem: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendSwatch: { width: 12, height: 12, borderRadius: 3 },
    legendHint: { marginTop: Spacing.xs },
    listHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    listHeaderText: { flex: 1 },
    listTotalsRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md },
    list: { gap: Spacing.md },
    expensePressed: { opacity: 0.85 },
    expenseCard: { padding: Spacing.lg },
    expenseRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
    expenseIcon: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    expenseInfo: { flex: 1 },
    expenseTopRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    expenseCategory: { flexShrink: 1 },
    typeTag: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: Radius.pill,
    },
    typeTagText: { fontSize: 9, lineHeight: 13 },
    expenseDescription: { marginTop: 2 },
    expenseAmountWrap: { alignItems: "flex-end", maxWidth: "42%" },
    expenseMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },
  });

export default ExpenseCalendarScreen;
