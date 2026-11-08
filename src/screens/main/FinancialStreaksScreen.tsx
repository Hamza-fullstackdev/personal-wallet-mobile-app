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
import { formatDate, toISODate } from '../../utils/format';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_MS = 86_400_000;

interface CalendarCell {
  day: number;
  key: string;
  noSpend: boolean;
  known: boolean;
  isToday: boolean;
}

interface StreakRun {
  start: Date;
  end: Date;
  length: number;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function FinancialStreaksScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const user = useAuthStore((state) => state.user);

  const [today] = useState(() => startOfDay(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const windowStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() - 11, 1),
    [today],
  );

  const historyStart = useMemo(() => {
    if (!user?.createdAt) return windowStart;
    const created = new Date(user.createdAt);
    if (Number.isNaN(created.getTime())) return windowStart;
    const createdDay = startOfDay(created);
    if (createdDay.getTime() > today.getTime()) return today;
    return createdDay;
  }, [user?.createdAt, today, windowStart]);

  const calendarMinMonth = useMemo(
    () => new Date(historyStart.getFullYear(), historyStart.getMonth(), 1),
    [historyStart],
  );
  const calendarMaxMonth = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today],
  );

  const queryEnd = useMemo(() => {
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [today]);

  const filters = useMemo(
    () => ({
      startDate: historyStart.toISOString(),
      endDate: queryEnd.toISOString(),
    }),
    [historyStart, queryEnd],
  );

  const { expenses, loading, refreshing, error, refetch } = useExpenses(filters);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const dailySpending = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((expense) => {
      if (expense.type === 'incoming') return;
      const key = toISODate(new Date(expense.date));
      map.set(key, (map.get(key) ?? 0) + expense.amount);
    });
    return map;
  }, [expenses]);

  const streakInfo = useMemo(() => {
    const runs: StreakRun[] = [];
    let runStart: Date | null = null;
    let lastNoSpend: Date | null = null;
    let cursor = new Date(historyStart);

    while (cursor.getTime() <= today.getTime()) {
      const spent = dailySpending.get(toISODate(cursor)) ?? 0;
      if (spent === 0) {
        if (!runStart) runStart = new Date(cursor);
        lastNoSpend = new Date(cursor);
      } else {
        if (runStart && lastNoSpend) {
          runs.push({
            start: runStart,
            end: lastNoSpend,
            length:
              Math.round(
                (lastNoSpend.getTime() - runStart.getTime()) / DAY_MS,
              ) + 1,
          });
        }
        runStart = null;
        lastNoSpend = null;
      }
      cursor = addDays(cursor, 1);
    }

    if (runStart && lastNoSpend) {
      runs.push({
        start: runStart,
        end: lastNoSpend,
        length:
          Math.round((lastNoSpend.getTime() - runStart.getTime()) / DAY_MS) + 1,
      });
    }

    const currentRun =
      runs.find((run) => run.end.getTime() === today.getTime()) ?? null;
    const longestRun = runs.reduce<StreakRun | null>(
      (best, run) => (!best || run.length > best.length ? run : best),
      null,
    );
    const previousRuns = runs
      .filter((run) => run !== currentRun && run.length >= 2)
      .sort((a, b) => b.end.getTime() - a.end.getTime());

    return { currentRun, longestRun, previousRuns };
  }, [dailySpending, historyStart, today]);

  const calendarWeeks = useMemo<(CalendarCell | null)[][]>(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

    const cells: (CalendarCell | null)[] = [];
    for (let index = 0; index < firstWeekday; index += 1) cells.push(null);

    for (let day = 1; day <= daysInCurrentMonth; day += 1) {
      const date = new Date(year, month, day);
      const key = toISODate(date);
      const known =
        date.getTime() >= historyStart.getTime() &&
        date.getTime() <= today.getTime();
      const spent = dailySpending.get(key) ?? 0;
      cells.push({
        day,
        key,
        noSpend: known && spent === 0,
        known,
        isToday: date.getTime() === today.getTime(),
      });
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (CalendarCell | null)[][] = [];
    for (let index = 0; index < cells.length; index += 7) {
      rows.push(cells.slice(index, index + 7));
    }
    return rows;
  }, [calendarMonth, dailySpending, historyStart, today]);

  const calendarNoSpendDays = useMemo(
    () => calendarWeeks.flat().filter((cell) => cell?.noSpend).length,
    [calendarWeeks],
  );

  const calendarLabel = calendarMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const changeCalendarMonth = (delta: number) => {
    setCalendarMonth((previous) => {
      const next = new Date(
        previous.getFullYear(),
        previous.getMonth() + delta,
        1,
      );
      if (next.getTime() < calendarMinMonth.getTime()) return previous;
      if (next.getTime() > calendarMaxMonth.getTime()) return previous;
      return next;
    });
  };

  const currentStreak = streakInfo.currentRun?.length ?? 0;
  const longestStreak = streakInfo.longestRun?.length ?? 0;
  const visiblePreviousRuns = streakInfo.previousRuns.slice(0, 12);

  const isLongest = (run: StreakRun) =>
    Boolean(
      streakInfo.longestRun &&
        run.start.getTime() === streakInfo.longestRun.start.getTime() &&
        run.end.getTime() === streakInfo.longestRun.end.getTime(),
    );

  return (
    <Screen
      title="Financial Streaks"
      icon="flame-outline"
      refreshing={refreshing}
      onRefresh={refetch}
    >
      {error ? <Banner message={error} type="error" /> : null}

      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <AppText variant="caption">Current streak</AppText>
            <View style={styles.streakValueRow}>
              <AppText variant="h1" color={colors.primary}>
                {currentStreak}
              </AppText>
              <AppText variant="caption">
                {currentStreak === 1 ? 'day' : 'days'}
              </AppText>
            </View>
            <AppText variant="caption" numberOfLines={2}>
              {streakInfo.currentRun
                ? `Since ${formatDate(streakInfo.currentRun.start)}`
                : 'No active no-spend streak'}
            </AppText>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <AppText variant="caption">Longest streak</AppText>
            <View style={styles.streakValueRow}>
              <AppText variant="h1" color={colors.success}>
                {longestStreak}
              </AppText>
              <AppText variant="caption">
                {longestStreak === 1 ? 'day' : 'days'}
              </AppText>
            </View>
            <AppText variant="caption" numberOfLines={2}>
              {streakInfo.longestRun
                ? `${formatDate(streakInfo.longestRun.start)} – ${formatDate(
                    streakInfo.longestRun.end,
                  )}`
                : 'No streaks yet'}
            </AppText>
          </View>
        </View>
      </Card>

      <View style={[styles.sectionHeader, styles.sectionSpacing]}>
        <View style={styles.sectionTitleWrap}>
          <AppText variant="h3">Streak calendar</AppText>
          <AppText variant="caption">
            {calendarNoSpendDays} no-spend{' '}
            {calendarNoSpendDays === 1 ? 'day' : 'days'} marked with a flame
          </AppText>
        </View>
      </View>

      <Card>
        <View style={styles.monthHeader}>
          <Pressable
            onPress={() => changeCalendarMonth(-1)}
            disabled={calendarMonth.getTime() <= calendarMinMonth.getTime()}
            hitSlop={10}
            style={[
              styles.monthButton,
              calendarMonth.getTime() <= calendarMinMonth.getTime()
                ? styles.monthButtonDisabled
                : null,
            ]}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={colors.primaryDeep}
            />
          </Pressable>
          <Pressable
            onPress={() =>
              setCalendarMonth(
                new Date(today.getFullYear(), today.getMonth(), 1),
              )
            }
            hitSlop={8}
          >
            <AppText variant="h3">{calendarLabel}</AppText>
          </Pressable>
          <Pressable
            onPress={() => changeCalendarMonth(1)}
            disabled={calendarMonth.getTime() >= calendarMaxMonth.getTime()}
            hitSlop={10}
            style={[
              styles.monthButton,
              calendarMonth.getTime() >= calendarMaxMonth.getTime()
                ? styles.monthButtonDisabled
                : null,
            ]}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.primaryDeep}
            />
          </Pressable>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((label, index) => (
            <View key={`${label}-${index}`} style={styles.weekdayCell}>
              <AppText variant="caption" center>
                {label}
              </AppText>
            </View>
          ))}
        </View>

        {calendarWeeks.map((week, weekIndex) => (
          <View key={`calendar-week-${weekIndex}`} style={styles.weekRow}>
            {week.map((cell, dayIndex) => {
              if (!cell) {
                return (
                  <View
                    key={`calendar-empty-${weekIndex}-${dayIndex}`}
                    style={styles.calendarCell}
                  />
                );
              }
              return (
                <View
                  key={cell.key}
                  style={[
                    styles.calendarCell,
                    cell.noSpend ? styles.calendarCellNoSpend : null,
                    cell.known && !cell.noSpend
                      ? styles.calendarCellSpent
                      : null,
                    !cell.known ? styles.calendarCellMuted : null,
                    cell.isToday ? styles.calendarCellToday : null,
                  ]}
                >
                  <AppText
                    variant="caption"
                    weight={cell.isToday ? 'semiBold' : 'regular'}
                    color={
                      cell.noSpend
                        ? colors.primary
                        : cell.known
                          ? colors.textSecondary
                          : colors.textMuted
                    }
                    style={styles.calendarDay}
                  >
                    {cell.day}
                  </AppText>
                  {cell.noSpend ? (
                    <Ionicons name="flame" size={11} color={colors.primary} />
                  ) : cell.known ? (
                    <View style={styles.spentDot} />
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}

        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <Ionicons name="flame" size={13} color={colors.primary} />
            <AppText variant="caption">No-spend day</AppText>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.spentDot} />
            <AppText variant="caption">Spent</AppText>
          </View>
        </View>
      </Card>

      <View style={[styles.sectionHeader, styles.sectionSpacing]}>
        <View style={styles.sectionTitleWrap}>
          <AppText variant="h3">Previous streaks</AppText>
          <AppText variant="caption">
            No-spend streaks you have maintained before
          </AppText>
        </View>
      </View>

      {streakInfo.previousRuns.length === 0 ? (
        <EmptyState
          icon="flame-outline"
          title="No previous streaks yet"
          message="String together two or more no-spend days to see a streak here."
        />
      ) : (
        <View style={styles.historyList}>
          {visiblePreviousRuns.map((run) => (
            <Card
              key={`${run.start.toISOString()}-${run.end.toISOString()}`}
              style={styles.historyCard}
            >
              <View style={styles.historyRow}>
                <View style={styles.historyIcon}>
                  <Ionicons name="flame" size={20} color={colors.primary} />
                </View>
                <View style={styles.historyInfo}>
                  <View style={styles.historyTitleRow}>
                    <AppText variant="label">
                      {run.length}-day streak
                    </AppText>
                    {isLongest(run) ? (
                      <View style={styles.longestBadge}>
                        <Ionicons
                          name="trophy"
                          size={11}
                          color={colors.success}
                        />
                        <AppText variant="caption" color={colors.success}>
                          Longest
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                  <AppText variant="caption" numberOfLines={1}>
                    {formatDate(run.start)} – {formatDate(run.end)}
                  </AppText>
                </View>
                <AppText variant="h3" color={colors.primary}>
                  {run.length}
                </AppText>
              </View>
            </Card>
          ))}

          {streakInfo.previousRuns.length > visiblePreviousRuns.length ? (
            <AppText variant="caption" center>
              Showing the {visiblePreviousRuns.length} most recent streaks
            </AppText>
          ) : null}
        </View>
      )}

      <Loader
        visible={loading && expenses.length === 0}
        message="Crunching your streaks..."
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    summaryCard: { padding: Spacing.lg },
    summaryRow: { flexDirection: 'row', alignItems: 'stretch' },
    summaryItem: { flex: 1, gap: 2 },
    summaryDivider: {
      width: 1,
      alignSelf: 'stretch',
      backgroundColor: colors.divider,
      marginHorizontal: Spacing.md,
    },
    streakValueRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: Spacing.xs,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    sectionSpacing: { marginTop: Spacing.xxl },
    sectionTitleWrap: { flex: 1 },
    monthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    monthButton: {
      width: 38,
      height: 38,
      borderRadius: Radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthButtonDisabled: { opacity: 0.35 },
    weekdayRow: { flexDirection: 'row', marginBottom: Spacing.xs },
    weekdayCell: { flex: 1, alignItems: 'center' },
    weekRow: { flexDirection: 'row' },
    calendarCell: {
      flex: 1,
      minHeight: 46,
      margin: 2,
      borderRadius: Radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    calendarCellNoSpend: { backgroundColor: colors.primarySoft },
    calendarCellSpent: { backgroundColor: colors.dangerFaint },
    calendarCellMuted: { backgroundColor: 'transparent' },
    calendarCellToday: {
      borderWidth: 1,
      borderColor: colors.primaryLight,
    },
    calendarDay: { fontSize: 11, lineHeight: 14 },
    spentDot: {
      width: 5,
      height: 5,
      borderRadius: Radius.pill,
      backgroundColor: colors.danger,
    },
    calendarLegend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: Spacing.md,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    historyList: { gap: Spacing.md },
    historyCard: { padding: Spacing.lg },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    historyIcon: {
      width: 42,
      height: 42,
      borderRadius: Radius.pill,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    historyInfo: { flex: 1, gap: 2 },
    historyTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    longestBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Radius.pill,
      backgroundColor: colors.successSoft,
    },
  });

export default FinancialStreaksScreen;
