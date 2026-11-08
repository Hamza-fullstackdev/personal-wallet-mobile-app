import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import {
  AppText,
  Banner,
  Card,
  EmptyState,
  Loader,
  Screen,
} from '../../components/ui';
import { useStatementData } from '../../hooks/useStatement';
import { useAuthStore } from '../../store/authStore';
import { Radius, Spacing, type ThemeColors } from '../../theme';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import {
  MONTHS_SHORT,
  compactAmount,
  endOfMonth,
  monthLabel,
  startOfYear,
  toDate,
  yearRange,
} from '../../utils/analytics';
import { formatAmount } from '../../utils/format';

interface MonthBucket {
  key: number;
  label: string;
  income: number;
  spending: number;
  net: number;
}

export function FinancialReplayScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const currency = useAuthStore((state) => state.user?.currency ?? 'PKR');

  const [yearAnchor, setYearAnchor] = useState(() => startOfYear(new Date()));
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  const range = useMemo(() => yearRange(yearAnchor), [yearAnchor]);
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

  const transactions = data?.transactions ?? [];

  const months = useMemo<MonthBucket[]>(() => {
    const year = yearAnchor.getFullYear();
    return Array.from({ length: 12 }, (_, monthIndex) => {
      const start = new Date(year, monthIndex, 1);
      const end = endOfMonth(start);
      let income = 0;
      let spending = 0;
      transactions.forEach((tx) => {
        const date = toDate(tx.rawDate);
        if (!date || date < start || date > end) return;
        income += tx.credit || 0;
        spending += tx.debit || 0;
      });
      return {
        key: monthIndex,
        label: MONTHS_SHORT[monthIndex],
        income,
        spending,
        net: income - spending,
      };
    });
  }, [transactions, yearAnchor]);

  const maxFlow = useMemo(
    () => Math.max(1, ...months.map((month) => Math.max(month.income, month.spending))),
    [months],
  );

  const totals = useMemo(
    () =>
      months.reduce(
        (acc, month) => ({
          income: acc.income + month.income,
          spending: acc.spending + month.spending,
        }),
        { income: 0, spending: 0 },
      ),
    [months],
  );

  const strongest = useMemo(
    () => months.reduce((best, month) => (month.net > best.net ? month : best), months[0]),
    [months],
  );

  const tightest = useMemo(
    () => months.reduce((worst, month) => (month.net < worst.net ? month : worst), months[0]),
    [months],
  );

  const current = months[index] ?? months[0];
  const cumulative = useMemo(
    () =>
      months.slice(0, index + 1).reduce((sum, month) => sum + month.net, 0),
    [months, index],
  );

  const transition = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [yearAnchor]);

  useEffect(() => {
    transition.setValue(0);
    Animated.timing(transition, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, transition]);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setIndex((previous) => {
        if (previous >= 11) {
          setPlaying(false);
          return previous;
        }
        return previous + 1;
      });
    }, 850);
    return () => clearInterval(timer);
  }, [playing]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (index >= 11) setIndex(0);
    setPlaying(true);
  };

  const changeYear = (delta: number) => {
    setYearAnchor(new Date(yearAnchor.getFullYear() + delta, 0, 1));
  };

  const translateY = transition.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  return (
    <Screen
      title="Financial Replay"
      icon="play-circle-outline"
      refreshing={refreshing}
      onRefresh={refetch}
    >
      <Card style={styles.navCard}>
        <View style={styles.navHeader}>
          <Pressable
            onPress={() => changeYear(-1)}
            hitSlop={10}
            style={styles.navButton}
          >
            <Ionicons name="chevron-back" size={20} color={colors.primaryDeep} />
          </Pressable>
          <Pressable
            onPress={() => setYearAnchor(startOfYear(new Date()))}
            hitSlop={8}
          >
            <AppText variant="h3" center>
              {yearAnchor.getFullYear()}
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => changeYear(1)}
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
        <View style={styles.yearSummary}>
          <View style={styles.yearStat}>
            <AppText variant="caption">Money in</AppText>
            <AppText variant="label" color={colors.success}>
              {currency} {formatAmount(totals.income, currency)}
            </AppText>
          </View>
          <View style={styles.yearDivider} />
          <View style={styles.yearStat}>
            <AppText variant="caption">Money out</AppText>
            <AppText variant="label" color={colors.danger}>
              {currency} {formatAmount(totals.spending, currency)}
            </AppText>
          </View>
          <View style={styles.yearDivider} />
          <View style={styles.yearStat}>
            <AppText variant="caption">Net</AppText>
            <AppText
              variant="label"
              color={totals.income - totals.spending >= 0 ? colors.success : colors.danger}
            >
              {currency} {formatAmount(totals.income - totals.spending, currency)}
            </AppText>
          </View>
        </View>
      </Card>

      {error ? <Banner message={error} type="error" /> : null}

      {transactions.length === 0 && !loading ? (
        <EmptyState
          icon="play-circle-outline"
          title="Nothing to replay"
          message="Add income and expenses for this year to watch your money story."
        />
      ) : (
        <>
          <Card style={styles.stageCard}>
            <Animated.View
              style={{
                opacity: transition,
                transform: [{ translateY }],
              }}
            >
              <View style={styles.stageHeader}>
                <View style={styles.stageTitleWrap}>
                  <AppText variant="caption">
                    Month {index + 1} of 12
                  </AppText>
                  <AppText variant="h1">{monthLabel(new Date(yearAnchor.getFullYear(), index, 1))}</AppText>
                </View>
                <View style={styles.stageBadge}>
                  <Ionicons name="film-outline" size={22} color={colors.primary} />
                </View>
              </View>

              <View style={styles.stageAmounts}>
                <View style={styles.stageAmountItem}>
                  <AppText variant="caption">In</AppText>
                  <AppText
                    variant="h2"
                    color={colors.success}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    +{formatAmount(current.income, currency)}
                  </AppText>
                </View>
                <View style={styles.stageAmountItem}>
                  <AppText variant="caption">Out</AppText>
                  <AppText
                    variant="h2"
                    color={colors.danger}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    -{formatAmount(current.spending, currency)}
                  </AppText>
                </View>
              </View>

              <View style={styles.stageFooter}>
                <View>
                  <AppText variant="caption">Month net</AppText>
                  <AppText
                    variant="label"
                    color={current.net >= 0 ? colors.success : colors.danger}
                  >
                    {current.net >= 0 ? '+' : '-'}
                    {formatAmount(Math.abs(current.net), currency)}
                  </AppText>
                </View>
                <View style={styles.stageFooterRight}>
                  <AppText variant="caption">Running total</AppText>
                  <AppText
                    variant="label"
                    color={cumulative >= 0 ? colors.success : colors.danger}
                  >
                    {cumulative >= 0 ? '+' : '-'}
                    {formatAmount(Math.abs(cumulative), currency)}
                  </AppText>
                </View>
              </View>
            </Animated.View>
          </Card>

          <Card style={styles.timelineCard}>
            <View style={styles.timelineHeader}>
              <AppText variant="h3">Monthly movement</AppText>
              <AppText variant="caption">Tap a month to jump</AppText>
            </View>

            <View style={styles.timeline}>
              {months.map((month, monthIndex) => {
                const active = monthIndex === index;
                return (
                  <Pressable
                    key={month.key}
                    onPress={() => {
                      setIndex(monthIndex);
                      setPlaying(false);
                    }}
                    style={[styles.timelineItem, active ? styles.timelineItemActive : null]}
                  >
                    <View style={styles.barsWrap}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: Math.max(2, (month.spending / maxFlow) * 74),
                            backgroundColor: colors.danger,
                            opacity: active ? 1 : 0.5,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.bar,
                          {
                            height: Math.max(2, (month.income / maxFlow) * 74),
                            backgroundColor: colors.success,
                            opacity: active ? 1 : 0.5,
                          },
                        ]}
                      />
                    </View>
                    <AppText
                      variant="caption"
                      weight={active ? 'semiBold' : 'regular'}
                      color={active ? colors.primary : colors.textMuted}
                      style={styles.monthLabel}
                    >
                      {month.label.slice(0, 1)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                <AppText variant="caption">Money in</AppText>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
                <AppText variant="caption">Money out</AppText>
              </View>
            </View>

            <View style={styles.controls}>
              <Pressable onPress={() => setIndex(0)} hitSlop={8} style={styles.controlGhost}>
                <Ionicons name="play-skip-back" size={18} color={colors.primary} />
              </Pressable>
              <Pressable onPress={togglePlay} style={styles.playButton}>
                <Ionicons
                  name={playing ? 'pause' : 'play'}
                  size={24}
                  color={colors.onPrimary}
                />
              </Pressable>
              <View style={styles.progressText}>
                <AppText variant="caption">
                  {current.label} · {compactAmount(current.spending)} out
                </AppText>
              </View>
            </View>
          </Card>

          <View style={styles.statRow}>
            <Card style={styles.statCard}>
              <AppText variant="caption">Strongest month</AppText>
              <AppText variant="h3">{strongest.label}</AppText>
              <AppText variant="caption" color={colors.success}>
                +{formatAmount(strongest.net, currency)}
              </AppText>
            </Card>
            <Card style={styles.statCard}>
              <AppText variant="caption">Tightest month</AppText>
              <AppText variant="h3">{tightest.label}</AppText>
              <AppText
                variant="caption"
                color={tightest.net < 0 ? colors.danger : colors.textMuted}
              >
                {tightest.net >= 0 ? '+' : '-'}
                {formatAmount(Math.abs(tightest.net), currency)}
              </AppText>
            </Card>
          </View>
        </>
      )}

      <Loader visible={loading && !data} message="Loading your replay..." />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    navCard: { marginBottom: Spacing.lg },
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
    yearSummary: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    yearStat: { flex: 1, gap: 2, minWidth: 0 },
    yearDivider: {
      width: 1,
      alignSelf: 'stretch',
      backgroundColor: colors.divider,
      marginHorizontal: Spacing.md,
    },
    stageCard: { marginBottom: Spacing.lg },
    stageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    stageTitleWrap: { flex: 1 },
    stageBadge: {
      width: 42,
      height: 42,
      borderRadius: Radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stageAmounts: {
      flexDirection: 'row',
      gap: Spacing.lg,
    },
    stageAmountItem: { flex: 1, gap: 2, minWidth: 0 },
    stageFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.lg,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    stageFooterRight: { alignItems: 'flex-end' },
    timelineCard: { marginBottom: Spacing.lg },
    timelineHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    timeline: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: 108,
      gap: 2,
    },
    timelineItem: {
      flex: 1,
      alignItems: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.xs,
      borderRadius: Radius.sm,
    },
    timelineItemActive: {
      backgroundColor: colors.primarySoft,
    },
    barsWrap: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 1,
      height: 76,
    },
    bar: {
      width: 4,
      borderRadius: Radius.pill,
    },
    monthLabel: { fontSize: 9, lineHeight: 11 },
    legendRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.xl,
      marginTop: Spacing.md,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    legendDot: { width: 10, height: 10, borderRadius: Radius.pill },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginTop: Spacing.lg,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    controlGhost: {
      width: 42,
      height: 42,
      borderRadius: Radius.pill,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playButton: {
      width: 54,
      height: 54,
      borderRadius: Radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressText: { flex: 1, alignItems: 'flex-end' },
    statRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    statCard: {
      flex: 1,
      gap: 2,
    },
  });

export default FinancialReplayScreen;
