import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useReceipt } from '../../components/receipt/ReceiptProvider';
import {
  AppText,
  Banner,
  Card,
  EmptyState,
  Loader,
  Screen,
} from '../../components/ui';
import { useExpenses } from '../../hooks/useExpenses';
import { useAuthStore } from '../../store/authStore';
import { Radius, Spacing, type ThemeColors } from '../../theme';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import type { Expense, ExpenseType } from '../../types';
import {
  formatAmount,
  formatDate,
  formatDateTime,
  toISODate,
} from '../../utils/format';
import { receiptFromExpense } from '../../utils/receipt';

type Period = 'week' | 'month' | 'year';

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const YEAR_WEEKDAY_LABELS = ['', 'M', '', 'W', '', 'F', ''];
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const YEAR_CELL = 12;
const YEAR_GAP = 3;
const YEAR_STEP = YEAR_CELL + YEAR_GAP;
const YEAR_WEEKDAY_WIDTH = 14;
const DAY_MS = 86_400_000;
const HEAT_ALPHAS = [0.16, 0.36, 0.62, 0.9];

interface DayBucket {
  spent: number;
  transactions: Expense[];
}

interface HeatDay {
  key: string;
  date: Date;
  inRange: boolean;
  spent: number;
  level: number;
}

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
  if (period === 'week') return startOfWeek(date);
  if (period === 'month') return new Date(date.getFullYear(), date.getMonth(), 1);
  return new Date(date.getFullYear(), 0, 1);
}

function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
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
  return type === 'incoming';
}

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((char) => char + char)
          .join('')
      : value;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((channel) => Number.isNaN(channel))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function heatColor(level: number, colors: ThemeColors): string {
  if (level <= 0) return colors.surfaceAlt;
  return hexToRgba(colors.primary, HEAT_ALPHAS[Math.min(level, 4) - 1]);
}

function heatTextColor(level: number, colors: ThemeColors): string {
  return level >= 3 ? colors.onPrimary : colors.textPrimary;
}

function heatSubColor(level: number, colors: ThemeColors): string {
  return level >= 3 ? 'rgba(255,255,255,0.82)' : colors.textMuted;
}

export function SpendingHeatmapScreen() {
  const { openReceipt } = useReceipt();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const currency = useAuthStore((state) => state.user?.currency ?? 'PKR');

  const [period, setPeriod] = useState<Period>('month');
  const [anchor, setAnchor] = useState(() => startOfPeriod(new Date(), 'month'));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const range = useMemo(() => {
    const start = new Date(anchor);
    start.setHours(0, 0, 0, 0);
    let end: Date;
    if (period === 'week') end = addDays(start, 6);
    else if (period === 'month')
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

  const { expenses, loading, refreshing, error, refetch } = useExpenses(filters);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const dailyTotals = useMemo(() => {
    const map = new Map<string, DayBucket>();
    expenses.forEach((expense) => {
      const key = toISODate(new Date(expense.date));
      const current = map.get(key) ?? { spent: 0, transactions: [] };
      if (!isIncome(expense.type)) current.spent += expense.amount;
      current.transactions.push(expense);
      map.set(key, current);
    });
    return map;
  }, [expenses]);

  const thresholds = useMemo(() => {
    const values = [...dailyTotals.values()]
      .map((bucket) => bucket.spent)
      .filter((value) => value > 0)
      .sort((a, b) => a - b);
    if (values.length === 0) return { q1: 0, q2: 0, q3: 0 };
    const at = (ratio: number) =>
      values[Math.min(values.length - 1, Math.floor(ratio * (values.length - 1)))];
    return { q1: at(0.25), q2: at(0.5), q3: at(0.75) };
  }, [dailyTotals]);

  const levelFor = useCallback(
    (amount: number) => {
      if (amount <= 0) return 0;
      if (amount <= thresholds.q1) return 1;
      if (amount <= thresholds.q2) return 2;
      if (amount <= thresholds.q3) return 3;
      return 4;
    },
    [thresholds],
  );

  const { totalSpent, activeDays, highest } = useMemo(() => {
    let spent = 0;
    let days = 0;
    let highestKey: string | null = null;
    let highestAmount = 0;
    dailyTotals.forEach((bucket, key) => {
      spent += bucket.spent;
      if (bucket.spent > 0) {
        days += 1;
        if (bucket.spent > highestAmount) {
          highestAmount = bucket.spent;
          highestKey = key;
        }
      }
    });
    return {
      totalSpent: spent,
      activeDays: days,
      highest:
        highestKey !== null
          ? { key: highestKey as string, amount: highestAmount }
          : null,
    };
  }, [dailyTotals]);

  const averagePerDay = activeDays > 0 ? totalSpent / activeDays : 0;
  const rangeDays =
    Math.round(
      (new Date(
        range.end.getFullYear(),
        range.end.getMonth(),
        range.end.getDate(),
      ).getTime() -
        range.start.getTime()) /
        DAY_MS,
    ) + 1;

  const weekDays = useMemo<HeatDay[]>(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(range.start, index);
        const key = toISODate(date);
        const spent = dailyTotals.get(key)?.spent ?? 0;
        return { key, date, inRange: true, spent, level: levelFor(spent) };
      }),
    [range, dailyTotals, levelFor],
  );

  const monthWeeks = useMemo<(HeatDay | null)[][]>(() => {
    const year = range.start.getFullYear();
    const month = range.start.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (HeatDay | null)[] = [];
    for (let index = 0; index < firstWeekday; index += 1) cells.push(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const key = toISODate(date);
      const spent = dailyTotals.get(key)?.spent ?? 0;
      cells.push({ key, date, inRange: true, spent, level: levelFor(spent) });
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (HeatDay | null)[][] = [];
    for (let index = 0; index < cells.length; index += 7) {
      rows.push(cells.slice(index, index + 7));
    }
    return rows;
  }, [range, dailyTotals, levelFor]);

  const yearWeeks = useMemo<HeatDay[][]>(() => {
    const year = range.start.getFullYear();
    const first = startOfWeek(new Date(year, 0, 1));
    const last = addDays(startOfWeek(new Date(year, 11, 31)), 6);

    const weeks: HeatDay[][] = [];
    let cursor = first;
    while (cursor <= last) {
      const week: HeatDay[] = [];
      for (let index = 0; index < 7; index += 1) {
        const date = addDays(cursor, index);
        const inYear = date.getFullYear() === year;
        const key = toISODate(date);
        const spent = inYear ? dailyTotals.get(key)?.spent ?? 0 : 0;
        week.push({
          key,
          date,
          inRange: inYear,
          spent,
          level: inYear ? levelFor(spent) : 0,
        });
      }
      weeks.push(week);
      cursor = addDays(cursor, 7);
    }
    return weeks;
  }, [range, dailyTotals, levelFor]);

  const yearMonthLabels = useMemo(() => {
    const year = range.start.getFullYear();
    const firstSunday = startOfWeek(new Date(year, 0, 1));
    return MONTH_LABELS.map((label, index) => {
      const firstOfMonth = new Date(year, index, 1);
      const days = Math.round(
        (firstOfMonth.getTime() - firstSunday.getTime()) / DAY_MS,
      );
      return { label, column: Math.floor(days / 7) };
    });
  }, [range]);

  const selectedExpenses = useMemo(() => {
    if (!selectedKey) return [];
    const bucket = dailyTotals.get(selectedKey);
    if (!bucket) return [];
    return [...bucket.transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [selectedKey, dailyTotals]);

  const selectedSpent = selectedKey
    ? dailyTotals.get(selectedKey)?.spent ?? 0
    : 0;

  const todayKey = toISODate(new Date());

  const rangeLabel = useMemo(() => {
    if (period === 'week') {
      const startLabel = range.start.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      const endLabel = range.end.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return `${startLabel} – ${endLabel}`;
    }
    if (period === 'month') {
      return range.start.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      });
    }
    return String(range.start.getFullYear());
  }, [period, range]);

  const changePeriod = (delta: number) => {
    setAnchor((previous) => {
      const base = new Date(previous);
      if (period === 'week') return addDays(base, delta * 7);
      if (period === 'month')
        return new Date(base.getFullYear(), base.getMonth() + delta, 1);
      return new Date(base.getFullYear() + delta, 0, 1);
    });
    setSelectedKey(null);
  };

  const switchPeriod = (next: Period) => {
    if (next === period) return;
    setPeriod(next);
    setAnchor((previous) => startOfPeriod(previous, next));
    setSelectedKey(null);
  };

  const goToToday = () => {
    setAnchor(startOfPeriod(new Date(), period));
    setSelectedKey(null);
  };

  const toggleDay = (key: string) => {
    setSelectedKey((previous) => (previous === key ? null : key));
  };

  const entryMeta = (type: ExpenseType) => {
    if (type === 'incoming') {
      return {
        label: 'Income',
        icon: 'arrow-down-circle' as const,
        fg: colors.success,
        bg: colors.successSoft,
      };
    }
    if (type === 'investment') {
      return {
        label: 'Investment',
        icon: 'trending-up' as const,
        fg: colors.primary,
        bg: colors.primarySoft,
      };
    }
    return {
      label: 'Expense',
      icon: 'arrow-up-circle' as const,
      fg: colors.danger,
      bg: colors.dangerSoft,
    };
  };

  return (
    <Screen
      title="Spending Heatmap"
      icon="grid-outline"
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
              style={[styles.segmentItem, active ? styles.segmentItemActive : null]}
            >
              <AppText
                variant="caption"
                weight="semiBold"
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
            <AppText variant="caption">Total spent</AppText>
            <AppText
              variant="h2"
              color={colors.danger}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {currency} {formatAmount(totalSpent, currency)}
            </AppText>
          </View>
          <View style={styles.summaryBadge}>
            <Ionicons name="flame" size={20} color={colors.primary} />
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryGridItem}>
            <AppText variant="caption">Active days</AppText>
            <AppText variant="label">
              {activeDays} / {rangeDays}
            </AppText>
          </View>
          <View style={styles.summaryGridItem}>
            <AppText variant="caption">Daily average</AppText>
            <AppText variant="label">
              {currency} {formatAmount(averagePerDay, currency)}
            </AppText>
          </View>
        </View>

        {highest ? (
          <View style={styles.highestRow}>
            <Ionicons name="trending-up" size={16} color={colors.danger} />
            <AppText variant="caption" numberOfLines={1} style={styles.highestText}>
              Highest on {formatDate(parseDateKey(highest.key))}
            </AppText>
            <AppText variant="label" color={colors.danger}>
              {currency} {formatAmount(highest.amount, currency)}
            </AppText>
          </View>
        ) : null}
      </Card>

      {error ? <Banner message={error} type="error" /> : null}

      <Card style={styles.heatCard}>
        <View style={styles.navHeader}>
          <Pressable
            onPress={() => changePeriod(-1)}
            hitSlop={10}
            style={styles.navButton}
          >
            <Ionicons name="chevron-back" size={20} color={colors.primaryDeep} />
          </Pressable>
          <Pressable onPress={goToToday} hitSlop={8}>
            <AppText variant="h3" center>
              {rangeLabel}
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => changePeriod(1)}
            hitSlop={10}
            style={styles.navButton}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.primaryDeep}
            />
          </Pressable>
        </View>

        {period === 'week' ? (
          <View style={styles.weekRow}>
            {weekDays.map((cell, index) => {
              const textColor = heatTextColor(cell.level, colors);
              const subColor = heatSubColor(cell.level, colors);
              const selected = selectedKey === cell.key;
              return (
                <Pressable
                  key={cell.key}
                  onPress={() => toggleDay(cell.key)}
                  style={[
                    styles.weekCell,
                    { backgroundColor: heatColor(cell.level, colors) },
                    cell.key === todayKey ? styles.todayCell : null,
                    selected ? styles.selectedCell : null,
                  ]}
                >
                  <AppText variant="caption" color={subColor}>
                    {WEEKDAY_LABELS[index]}
                  </AppText>
                  <AppText
                    variant="h3"
                    color={textColor}
                    weight={selected ? 'semiBold' : 'regular'}
                  >
                    {cell.date.getDate()}
                  </AppText>
                  <AppText
                    variant="caption"
                    color={subColor}
                    style={styles.weekAmount}
                  >
                    {cell.spent > 0 ? compactAmount(cell.spent) : '—'}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {period === 'month' ? (
          <>
            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label, index) => (
                <View key={`${label}-${index}`} style={styles.weekdayCell}>
                  <AppText variant="caption" center>
                    {label}
                  </AppText>
                </View>
              ))}
            </View>

            {monthWeeks.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={styles.weekRow}>
                {week.map((cell, dayIndex) => {
                  if (!cell) {
                    return (
                      <View
                        key={`empty-${weekIndex}-${dayIndex}`}
                        style={styles.monthCell}
                      />
                    );
                  }
                  const selected = selectedKey === cell.key;
                  const textColor = heatTextColor(cell.level, colors);
                  const subColor = heatSubColor(cell.level, colors);
                  return (
                    <Pressable
                      key={cell.key}
                      onPress={() => toggleDay(cell.key)}
                      style={[
                        styles.monthCell,
                        { backgroundColor: heatColor(cell.level, colors) },
                        cell.key === todayKey ? styles.todayCell : null,
                        selected ? styles.selectedCell : null,
                      ]}
                    >
                      <AppText
                        variant="caption"
                        weight={selected ? 'semiBold' : 'regular'}
                        color={textColor}
                        style={styles.monthDay}
                      >
                        {cell.date.getDate()}
                      </AppText>
                      {cell.spent > 0 ? (
                        <AppText
                          variant="caption"
                          color={subColor}
                          style={styles.monthAmount}
                        >
                          {compactAmount(cell.spent)}
                        </AppText>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </>
        ) : null}

        {period === 'year' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.yearScroll}
          >
            <View>
              <View
                style={[
                  styles.yearMonths,
                  { width: yearWeeks.length * YEAR_STEP },
                ]}
              >
                {yearMonthLabels.map((item) => (
                  <AppText
                    key={item.label}
                    variant="caption"
                    style={[
                      styles.yearMonthLabel,
                      {
                        left:
                          YEAR_WEEKDAY_WIDTH + item.column * YEAR_STEP,
                      },
                    ]}
                  >
                    {item.label}
                  </AppText>
                ))}
              </View>

              <View style={styles.yearBody}>
                <View style={styles.yearWeekdays}>
                  {YEAR_WEEKDAY_LABELS.map((label, index) => (
                    <View key={`year-label-${index}`} style={styles.yearWeekdayCell}>
                      <AppText variant="caption">{label}</AppText>
                    </View>
                  ))}
                </View>

                <View style={styles.yearWeeks}>
                  {yearWeeks.map((week, weekIndex) => (
                    <View key={`year-week-${weekIndex}`} style={styles.yearWeekColumn}>
                      {week.map((cell) => {
                        const selected = selectedKey === cell.key;
                        return (
                          <Pressable
                            key={cell.key}
                            disabled={!cell.inRange}
                            onPress={() => toggleDay(cell.key)}
                            style={[
                              styles.yearCell,
                              { backgroundColor: heatColor(cell.level, colors) },
                              !cell.inRange ? styles.yearCellOut : null,
                              selected ? styles.selectedCell : null,
                            ]}
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        ) : null}

        <View style={styles.legend}>
          <AppText variant="caption">Less</AppText>
          {[0, 1, 2, 3, 4].map((level) => (
            <View
              key={level}
              style={[styles.legendSwatch, { backgroundColor: heatColor(level, colors) }]}
            />
          ))}
          <AppText variant="caption">More</AppText>
        </View>
        <AppText variant="caption" style={styles.legendHint}>
          Tap a day to see its transactions
        </AppText>
      </Card>

      <View style={styles.listHeader}>
        <View style={styles.listHeaderText}>
          <AppText variant="h3">
            {selectedKey ? formatDate(parseDateKey(selectedKey)) : 'Transactions'}
          </AppText>
          <AppText variant="caption">
            {selectedKey
              ? `${selectedExpenses.length} ${
                  selectedExpenses.length === 1 ? 'entry' : 'entries'
                } · Spent ${currency} ${formatAmount(selectedSpent, currency)}`
              : 'Select a day on the heatmap above'}
          </AppText>
        </View>
        {selectedKey ? (
          <Pressable onPress={() => setSelectedKey(null)} hitSlop={8}>
            <AppText variant="label" color={colors.primary}>
              Clear
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {!selectedKey ? (
        <Card style={styles.hintCard}>
          <View style={styles.hintRow}>
            <View style={styles.hintIcon}>
              <Ionicons
                name="hand-left-outline"
                size={18}
                color={colors.primary}
              />
            </View>
            <AppText variant="caption" style={styles.hintText}>
              Tap any colored day to view every transaction recorded on it.
            </AppText>
          </View>
        </Card>
      ) : selectedExpenses.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No transactions"
          message="Nothing was recorded on this day."
        />
      ) : (
        <View style={styles.list}>
          {selectedExpenses.map((expense) => {
            const meta = entryMeta(expense.type);
            const income = isIncome(expense.type);
            return (
              <Pressable
                key={expense.id}
                onPress={() => openReceipt(receiptFromExpense(expense))}
                style={({ pressed }) => (pressed ? styles.pressed : null)}
              >
                <Card style={styles.expenseCard}>
                  <View style={styles.expenseRow}>
                    <View style={[styles.expenseIcon, { backgroundColor: meta.bg }]}>
                      <Ionicons name={meta.icon} size={18} color={meta.fg} />
                    </View>
                    <View style={styles.expenseInfo}>
                      <AppText variant="label" numberOfLines={1}>
                        {expense.category}
                      </AppText>
                      <AppText variant="caption" numberOfLines={1}>
                        {expense.description}
                      </AppText>
                    </View>
                    <View style={styles.expenseAmountWrap}>
                      <AppText
                        variant="amount"
                        color={meta.fg}
                        numberOfLines={1}
                      >
                        {income ? '+' : '-'} {currency}{' '}
                        {formatAmount(expense.amount, currency)}
                      </AppText>
                      <View style={styles.expenseMetaRow}>
                        <AppText variant="caption">
                          {formatDateTime(expense.date)}
                        </AppText>
                        <Ionicons
                          name="chevron-forward"
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
      )}

      <Loader
        visible={loading && expenses.length === 0}
        message="Loading heatmap..."
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    segment: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    segmentItem: {
      flex: 1,
      alignItems: 'center',
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    summaryText: { flex: 1, gap: 2 },
    summaryBadge: {
      width: 42,
      height: 42,
      borderRadius: Radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryGrid: {
      flexDirection: 'row',
      columnGap: Spacing.lg,
      rowGap: Spacing.md,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    summaryGridItem: { flex: 1, gap: 2 },
    highestRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    highestText: { flex: 1 },
    heatCard: { marginBottom: Spacing.lg },
    navHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    navButton: {
      width: 38,
      height: 38,
      borderRadius: Radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    weekRow: { flexDirection: 'row' },
    weekCell: {
      flex: 1,
      minHeight: 74,
      margin: 2,
      borderRadius: Radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    weekAmount: { fontSize: 9, lineHeight: 12 },
    weekdayRow: { flexDirection: 'row', marginBottom: Spacing.xs },
    weekdayCell: { flex: 1, alignItems: 'center' },
    monthCell: {
      flex: 1,
      minHeight: 46,
      margin: 2,
      borderRadius: Radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthDay: { fontSize: 11, lineHeight: 14 },
    monthAmount: { fontSize: 8, lineHeight: 10 },
    todayCell: { borderWidth: 1, borderColor: colors.primaryLight },
    selectedCell: { borderWidth: 2, borderColor: colors.primaryDeep },
    yearScroll: { paddingBottom: Spacing.xs },
    yearMonths: { height: 16, position: 'relative' },
    yearMonthLabel: { position: 'absolute' },
    yearBody: { flexDirection: 'row' },
    yearWeekdays: { width: YEAR_WEEKDAY_WIDTH },
    yearWeekdayCell: {
      height: YEAR_STEP,
      alignItems: 'center',
      justifyContent: 'center',
    },
    yearWeeks: { flexDirection: 'row' },
    yearWeekColumn: { marginRight: YEAR_GAP },
    yearCell: {
      width: YEAR_CELL,
      height: YEAR_CELL,
      borderRadius: 3,
      marginBottom: YEAR_GAP,
    },
    yearCellOut: { backgroundColor: 'transparent' },
    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: Spacing.xs,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    legendSwatch: { width: 12, height: 12, borderRadius: 3 },
    legendHint: { marginTop: Spacing.xs },
    listHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    listHeaderText: { flex: 1 },
    hintCard: { padding: Spacing.lg },
    hintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    hintIcon: {
      width: 36,
      height: 36,
      borderRadius: Radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hintText: { flex: 1 },
    list: { gap: Spacing.md },
    pressed: { opacity: 0.85 },
    expenseCard: { padding: Spacing.lg },
    expenseRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    expenseIcon: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    expenseInfo: { flex: 1 },
    expenseAmountWrap: { alignItems: 'flex-end', maxWidth: '42%' },
    expenseMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
  });

export default SpendingHeatmapScreen;
