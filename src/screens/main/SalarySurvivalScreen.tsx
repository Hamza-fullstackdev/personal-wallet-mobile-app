import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Gauge } from '../../components/charts';
import {
  AppText,
  Banner,
  Card,
  Loader,
  Screen,
} from '../../components/ui';
import { useStatementData } from '../../hooks/useStatement';
import { useAuthStore } from '../../store/authStore';
import { Radius, Spacing, type ThemeColors } from '../../theme';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import {
  addDays,
  addMonths,
  clamp,
  incomeAmount,
  monthLabel,
  monthRange,
  spendingAmount,
  startOfMonth,
} from '../../utils/analytics';
import { formatAmount, formatDate } from '../../utils/format';

export function SalarySurvivalScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const currency = useAuthStore((state) => state.user?.currency ?? 'PKR');

  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));

  const range = useMemo(() => monthRange(anchor), [anchor]);
  const query = useMemo(
    () => ({
      startDate: range.start.toISOString(),
      endDate: range.end.toISOString(),
    }),
    [range],
  );

  const { data, loading, refreshing, error, refetch } = useStatementData(query);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const stats = useMemo(() => {
    const transactions = data?.transactions ?? [];
    const income = transactions.reduce((sum, tx) => sum + incomeAmount(tx), 0);
    const spending = transactions.reduce((sum, tx) => sum + spendingAmount(tx), 0);

    const monthDays = new Date(
      anchor.getFullYear(),
      anchor.getMonth() + 1,
      0,
    ).getDate();
    const today = new Date();
    const isCurrentMonth =
      today.getFullYear() === anchor.getFullYear() &&
      today.getMonth() === anchor.getMonth();
    const currentMonthStart = startOfMonth(today);
    const isPastMonth = anchor.getTime() < currentMonthStart.getTime();
    const elapsedDays = isCurrentMonth
      ? Math.min(today.getDate(), monthDays)
      : isPastMonth
        ? monthDays
        : 0;

    const dailyBurn = elapsedDays > 0 ? spending / elapsedDays : 0;
    const daysCovered =
      income <= 0
        ? 0
        : dailyBurn <= 0
          ? monthDays
          : Math.min(monthDays, Math.floor(income / dailyBurn));

    const coverage = monthDays > 0 ? clamp(daysCovered / monthDays, 0, 1) : 0;
    const runOutDate = addDays(range.start, Math.min(daysCovered, monthDays - 1));
    const overIncome = spending > income && income > 0;
    const remaining = income - spending;

    const status =
      income <= 0
        ? 'No income recorded for this month.'
        : spending <= 0
          ? 'No spending yet. Your salary is fully intact.'
          : overIncome
            ? `Spending passed your income on ${formatDate(runOutDate)}.`
            : daysCovered >= monthDays
              ? 'Your income covers the entire month.'
              : `At this pace, your income lasts until ${formatDate(runOutDate)}.`;

    return {
      income,
      spending,
      monthDays,
      elapsedDays,
      dailyBurn,
      daysCovered,
      coverage,
      remaining,
      overIncome,
      status,
      isCurrentMonth,
    };
  }, [data, anchor, range.start]);

  const gaugeColor =
    stats.income <= 0
      ? colors.textMuted
      : stats.daysCovered >= stats.monthDays
        ? colors.success
        : stats.overIncome || stats.daysCovered < stats.elapsedDays
          ? colors.danger
          : colors.primaryLight;

  const changeMonth = (delta: number) => {
    setAnchor((previous) => addMonths(previous, delta));
  };

  return (
    <Screen
      title="Survival Meter"
      icon="hourglass-outline"
      refreshing={refreshing}
      onRefresh={refetch}
    >
      {error ? <Banner message={error} type="error" /> : null}

      <Card style={styles.gaugeCard}>
        <View style={styles.navHeader}>
          <Pressable
            onPress={() => changeMonth(-1)}
            hitSlop={10}
            style={styles.navButton}
          >
            <Ionicons name="chevron-back" size={20} color={colors.primaryDeep} />
          </Pressable>
          <Pressable onPress={() => setAnchor(startOfMonth(new Date()))} hitSlop={8}>
            <AppText variant="h3" center>
              {monthLabel(anchor)}
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => changeMonth(1)}
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

        <View style={styles.gaugeWrap}>
          <Gauge
            progress={stats.coverage}
            color={gaugeColor}
            label="Month covered"
            value={`${Math.round(stats.coverage * 100)}%`}
            caption={`${stats.daysCovered} of ${stats.monthDays} days`}
          />
        </View>

        <View
          style={[
            styles.statusRow,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.divider },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: gaugeColor }]} />
          <AppText variant="caption" style={styles.statusText}>
            {stats.status}
          </AppText>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <AppText variant="caption">Income</AppText>
            <AppText
              variant="label"
              color={colors.success}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {currency} {formatAmount(stats.income, currency)}
            </AppText>
          </View>
          <View style={styles.statItem}>
            <AppText variant="caption">Spent</AppText>
            <AppText
              variant="label"
              color={colors.danger}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {currency} {formatAmount(stats.spending, currency)}
            </AppText>
          </View>
          <View style={styles.statItem}>
            <AppText variant="caption">Daily burn</AppText>
            <AppText variant="label" numberOfLines={1} adjustsFontSizeToFit>
              {currency} {formatAmount(stats.dailyBurn, currency)}
            </AppText>
          </View>
          <View style={styles.statItem}>
            <AppText variant="caption">Days left</AppText>
            <AppText variant="label">
              {Math.max(0, stats.monthDays - stats.daysCovered)}
            </AppText>
          </View>
        </View>

        <View style={styles.timelineSection}>
          <View style={styles.timelineTrack}>
            <View
              style={[
                styles.timelineFill,
                {
                  width: `${stats.coverage * 100}%`,
                  backgroundColor: gaugeColor,
                },
              ]}
            />
            {stats.isCurrentMonth ? (
              <View
                style={[
                  styles.todayMarker,
                  {
                    left: `${(stats.elapsedDays / stats.monthDays) * 100}%`,
                    backgroundColor: colors.textPrimary,
                  },
                ]}
              />
            ) : null}
          </View>
          <View style={styles.timelineLabels}>
            <AppText variant="caption">Day 1</AppText>
            {stats.isCurrentMonth ? (
              <AppText variant="caption">Today · Day {stats.elapsedDays}</AppText>
            ) : (
              <AppText variant="caption">{stats.monthDays} days</AppText>
            )}
            <AppText variant="caption">Day {stats.monthDays}</AppText>
          </View>
        </View>
      </Card>

      <Card style={styles.hintCard}>
        <View style={styles.hintRow}>
          <View style={styles.hintIcon}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          </View>
          <AppText variant="caption" style={styles.hintText}>
            Survival is estimated from your current daily spending pace. Add or edit
            expenses to keep the forecast accurate.
          </AppText>
        </View>
      </Card>

      <Loader visible={loading && !data} message="Calculating survival..." />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    gaugeCard: { marginBottom: Spacing.lg },
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
    gaugeWrap: {
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      padding: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      marginBottom: Spacing.lg,
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: Radius.pill,
    },
    statusText: { flex: 1 },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    statItem: {
      width: '50%',
      gap: 2,
      paddingRight: Spacing.sm,
    },
    timelineSection: {
      paddingTop: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    timelineTrack: {
      height: 14,
      borderRadius: Radius.pill,
      backgroundColor: colors.surfaceAlt,
      overflow: 'hidden',
      position: 'relative',
    },
    timelineFill: {
      height: '100%',
      borderRadius: Radius.pill,
    },
    todayMarker: {
      position: 'absolute',
      top: -2,
      bottom: -2,
      width: 2,
      marginLeft: -1,
    },
    timelineLabels: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.xs,
    },
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
  });

export default SalarySurvivalScreen;
