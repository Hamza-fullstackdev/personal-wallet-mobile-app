import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

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
import { formatAmount } from '../../utils/format';

type Period = 'week' | 'month' | 'year';
type Direction = 'up' | 'down' | 'flat';

interface Delta {
  label: string;
  direction: Direction;
}

interface Range {
  start: Date;
  end: Date;
}

interface SpendStats {
  total: number;
  categories: Map<string, number>;
}

interface CategoryRow {
  name: string;
  current: number;
  previous: number;
  delta: Delta;
}

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
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
  if (period === 'week') return startOfWeek(date);
  if (period === 'month') return new Date(date.getFullYear(), date.getMonth(), 1);
  return new Date(date.getFullYear(), 0, 1);
}

function buildRange(period: Period, anchor: Date): Range {
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
}

function previousAnchor(period: Period, anchor: Date): Date {
  if (period === 'week') return addDays(anchor, -7);
  if (period === 'month')
    return new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1);
  return new Date(anchor.getFullYear() - 1, 0, 1);
}

function isIncome(type: ExpenseType): boolean {
  return type === 'incoming';
}

function buildStats(expenses: Expense[]): SpendStats {
  let total = 0;
  const categories = new Map<string, number>();
  expenses.forEach((expense) => {
    if (isIncome(expense.type)) return;
    total += expense.amount;
    const name = expense.category?.trim() || 'Uncategorized';
    categories.set(name, (categories.get(name) ?? 0) + expense.amount);
  });
  return { total, categories };
}

function deltaFor(current: number, previous: number): Delta {
  if (current === previous) return { label: '0%', direction: 'flat' };
  if (previous === 0) return { label: 'New', direction: 'up' };
  const percent = ((current - previous) / previous) * 100;
  if (Math.abs(percent) < 0.5) return { label: '0%', direction: 'flat' };
  return {
    label: `${percent > 0 ? '+' : ''}${Math.round(percent)}%`,
    direction: percent > 0 ? 'up' : 'down',
  };
}

function rangeLabel(range: Range, period: Period): string {
  if (period === 'week') {
    const start = range.start.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    const end = range.end.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${start} – ${end}`;
  }
  if (period === 'month') {
    return range.start.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }
  return String(range.start.getFullYear());
}

export function SpendingComparisonScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const currency = useAuthStore((state) => state.user?.currency ?? 'PKR');

  const [period, setPeriod] = useState<Period>('month');
  const [anchor, setAnchor] = useState(() => startOfPeriod(new Date(), 'month'));

  const currentRange = useMemo(() => buildRange(period, anchor), [period, anchor]);
  const previousRange = useMemo(
    () => buildRange(period, previousAnchor(period, anchor)),
    [period, anchor],
  );

  const currentQuery = useExpenses({
    startDate: currentRange.start.toISOString(),
    endDate: currentRange.end.toISOString(),
  });
  const previousQuery = useExpenses({
    startDate: previousRange.start.toISOString(),
    endDate: previousRange.end.toISOString(),
  });

  const { refetch: refetchCurrent } = currentQuery;
  const { refetch: refetchPrevious } = previousQuery;

  useFocusEffect(
    useCallback(() => {
      void refetchCurrent();
      void refetchPrevious();
    }, [refetchCurrent, refetchPrevious]),
  );

  const refetch = useCallback(() => {
    void refetchCurrent();
    void refetchPrevious();
  }, [refetchCurrent, refetchPrevious]);

  const currentStats = useMemo(
    () => buildStats(currentQuery.expenses),
    [currentQuery.expenses],
  );
  const previousStats = useMemo(
    () => buildStats(previousQuery.expenses),
    [previousQuery.expenses],
  );

  const categoryRows = useMemo<CategoryRow[]>(() => {
    const names = new Set<string>([
      ...currentStats.categories.keys(),
      ...previousStats.categories.keys(),
    ]);
    return [...names]
      .map((name) => {
        const current = currentStats.categories.get(name) ?? 0;
        const previous = previousStats.categories.get(name) ?? 0;
        return { name, current, previous, delta: deltaFor(current, previous) };
      })
      .sort((a, b) => b.current - a.current || b.previous - a.previous);
  }, [currentStats, previousStats]);

  const maxCategoryValue = useMemo(
    () =>
      Math.max(
        1,
        ...categoryRows.map((row) => Math.max(row.current, row.previous)),
      ),
    [categoryRows],
  );

  const overallDelta = deltaFor(currentStats.total, previousStats.total);
  const difference = currentStats.total - previousStats.total;

  const loading = currentQuery.loading || previousQuery.loading;
  const refreshing = currentQuery.refreshing || previousQuery.refreshing;
  const error = currentQuery.error || previousQuery.error;
  const hasData =
    currentQuery.expenses.length > 0 || previousQuery.expenses.length > 0;

  const deltaTone = (direction: Direction) => {
    if (direction === 'up')
      return { fg: colors.danger, bg: colors.dangerSoft };
    if (direction === 'down')
      return { fg: colors.success, bg: colors.successSoft };
    return { fg: colors.textMuted, bg: colors.surfaceAlt };
  };

  const deltaIcon = (direction: Direction) => {
    if (direction === 'up') return 'arrow-up' as const;
    if (direction === 'down') return 'arrow-down' as const;
    return 'remove' as const;
  };

  const renderDelta = (delta: Delta) => {
    const tone = deltaTone(delta.direction);
    return (
      <View style={[styles.deltaBadge, { backgroundColor: tone.bg }]}>
        <Ionicons name={deltaIcon(delta.direction)} size={13} color={tone.fg} />
        <AppText variant="caption" weight="semiBold" color={tone.fg}>
          {delta.label}
        </AppText>
      </View>
    );
  };

  const changePeriod = (delta: number) => {
    setAnchor((previous) => {
      if (period === 'week') return addDays(previous, delta * 7);
      if (period === 'month')
        return new Date(previous.getFullYear(), previous.getMonth() + delta, 1);
      return new Date(previous.getFullYear() + delta, 0, 1);
    });
  };

  const switchPeriod = (next: Period) => {
    if (next === period) return;
    setPeriod(next);
    setAnchor((previous) => startOfPeriod(previous, next));
  };

  const goToToday = () => {
    setAnchor(startOfPeriod(new Date(), period));
  };

  return (
    <Screen
      title="Spending Comparison"
      icon="git-compare-outline"
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

      {error ? <Banner message={error} type="error" /> : null}

      <Card style={styles.summaryCard}>
        <View style={styles.navHeader}>
          <Pressable
            onPress={() => changePeriod(-1)}
            hitSlop={10}
            style={styles.navButton}
          >
            <Ionicons name="chevron-back" size={20} color={colors.primaryDeep} />
          </Pressable>
          <Pressable onPress={goToToday} hitSlop={8} style={styles.navCenter}>
            <AppText variant="h3" center numberOfLines={1}>
              {rangeLabel(currentRange, period)}
            </AppText>
            <AppText variant="caption" center numberOfLines={1}>
              vs {rangeLabel(previousRange, period)}
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

        <View style={styles.summaryTop}>
          <View style={styles.summaryText}>
            <AppText variant="caption">This {period}</AppText>
            <AppText
              variant="h2"
              color={colors.danger}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {currency} {formatAmount(currentStats.total, currency)}
            </AppText>
          </View>
          {renderDelta(overallDelta)}
        </View>

        <View style={styles.compareRow}>
          <View style={styles.compareItem}>
            <AppText variant="caption">Last {period}</AppText>
            <AppText variant="label">
              {currency} {formatAmount(previousStats.total, currency)}
            </AppText>
          </View>
          <View style={styles.compareDivider} />
          <View style={styles.compareItem}>
            <AppText variant="caption">Difference</AppText>
            <AppText
              variant="label"
              color={
                difference > 0
                  ? colors.danger
                  : difference < 0
                    ? colors.success
                    : colors.textSecondary
              }
            >
              {difference === 0 ? '' : difference > 0 ? '+' : '-'} {currency}{' '}
              {formatAmount(Math.abs(difference), currency)}
            </AppText>
          </View>
        </View>
      </Card>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleWrap}>
          <AppText variant="h3">Category breakdown</AppText>
          <AppText variant="caption">
            This {period} vs last {period}
          </AppText>
        </View>
        <AppText variant="caption">
          {categoryRows.length}{' '}
          {categoryRows.length === 1 ? 'category' : 'categories'}
        </AppText>
      </View>

      {!loading && categoryRows.length === 0 ? (
        <EmptyState
          icon="git-compare-outline"
          title="Nothing to compare"
          message="Add expenses in this period or the previous one to see comparisons."
        />
      ) : null}

      <View style={styles.list}>
        {categoryRows.map((row) => {
          const currentColor =
            row.current > row.previous
              ? colors.danger
              : row.current < row.previous
                ? colors.success
                : colors.primary;
          return (
            <Card key={row.name} style={styles.categoryCard}>
              <View style={styles.categoryTop}>
                <View style={styles.categoryInfo}>
                  <AppText variant="label" numberOfLines={1}>
                    {row.name}
                  </AppText>
                  <AppText variant="caption">
                    This {currency} {formatAmount(row.current, currency)}
                  </AppText>
                </View>
                {renderDelta(row.delta)}
              </View>

              <View style={styles.bars}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      styles.barPrevious,
                      {
                        width: `${(row.previous / maxCategoryValue) * 100}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: currentColor,
                        width: `${(row.current / maxCategoryValue) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.barLabels}>
                <AppText variant="caption">
                  Last {currency} {formatAmount(row.previous, currency)}
                </AppText>
                <AppText variant="caption">
                  This {currency} {formatAmount(row.current, currency)}
                </AppText>
              </View>
            </Card>
          );
        })}
      </View>

      <Loader
        visible={loading && !hasData}
        message="Comparing spending..."
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
    navHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    navCenter: { flex: 1 },
    navButton: {
      width: 38,
      height: 38,
      borderRadius: Radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    summaryText: { flex: 1, gap: 2 },
    deltaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: Radius.pill,
    },
    compareRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    compareItem: { flex: 1, gap: 2 },
    compareDivider: {
      width: 1,
      alignSelf: 'stretch',
      backgroundColor: colors.divider,
      marginHorizontal: Spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    sectionTitleWrap: { flex: 1 },
    list: { gap: Spacing.md },
    categoryCard: { padding: Spacing.lg },
    categoryTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    categoryInfo: { flex: 1 },
    bars: { gap: 4, marginTop: Spacing.md },
    barTrack: {
      height: 8,
      borderRadius: Radius.pill,
      backgroundColor: colors.primaryFaint,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: Radius.pill,
    },
    barPrevious: { backgroundColor: colors.border },
    barLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: Spacing.xs,
    },
  });

export default SpendingComparisonScreen;
