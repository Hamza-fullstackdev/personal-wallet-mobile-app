import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ExpenseDnaChart, type ExpenseDnaGene } from '../../components/charts';
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
import type { StatementTransaction } from '../../types';
import {
  WEEKDAYS_LONG,
  isExpenseTransaction,
  spendingAmount,
  toDate,
  transactionCategory,
} from '../../utils/analytics';
import { chartPalette } from '../../utils/chartData';
import { daysAgo, formatAmount, toISODate } from '../../utils/format';

type DnaPeriod = '30' | '90' | '365';
type IoniconName = ComponentProps<typeof Ionicons>['name'];

const PERIODS: { label: string; value: DnaPeriod }[] = [
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
  { label: '1 year', value: '365' },
];

interface CategoryTotal {
  name: string;
  amount: number;
}

interface Trait {
  icon: IoniconName;
  label: string;
  value: string;
  detail: string;
}

function categoryTotals(transactions: StatementTransaction[]): CategoryTotal[] {
  const map = new Map<string, number>();
  transactions.forEach((tx) => {
    const amount = spendingAmount(tx);
    if (amount <= 0) return;
    const name = transactionCategory(tx);
    map.set(name, (map.get(name) ?? 0) + amount);
  });
  return Array.from(map, ([name, amount]) => ({ name, amount })).sort(
    (a, b) => b.amount - a.amount || a.name.localeCompare(b.name),
  );
}

export function ExpenseDnaScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const currency = useAuthStore((state) => state.user?.currency ?? 'PKR');

  const [period, setPeriod] = useState<DnaPeriod>('90');

  const rangeStart = useMemo(() => daysAgo(Number(period)), [period]);
  const query = useMemo(
    () => ({
      startDate: toISODate(rangeStart),
      endDate: toISODate(new Date()),
    }),
    [rangeStart],
  );

  const { data, loading, refreshing, error, refetch } = useStatementData(query);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const spending = useMemo(
    () => (data?.transactions ?? []).filter(isExpenseTransaction),
    [data],
  );

  const categories = useMemo(() => categoryTotals(spending), [spending]);
  const total = useMemo(
    () => categories.reduce((sum, category) => sum + category.amount, 0),
    [categories],
  );

  const palette = useMemo(() => chartPalette(colors), [colors]);

  const genes = useMemo<ExpenseDnaGene[]>(() => {
    const colored = categories.map((category, index) => ({
      ...category,
      value: category.amount,
      color: palette[index % palette.length],
    }));
    if (colored.length <= 8) return colored;
    const head = colored.slice(0, 7);
    const other = colored.slice(7).reduce(
      (acc, category) => ({
        ...acc,
        value: acc.value + category.value,
      }),
      { name: 'Other', value: 0, color: palette[7] },
    );
    return [...head, other];
  }, [categories, palette]);

  const profile = useMemo(() => {
    const weekdayTotals = Array.from({ length: 7 }, () => 0);
    const parts = [
      { name: 'Morning', amount: 0 },
      { name: 'Afternoon', amount: 0 },
      { name: 'Evening', amount: 0 },
      { name: 'Night', amount: 0 },
    ];
    let weekend = 0;
    let largest = 0;

    spending.forEach((tx) => {
      const amount = spendingAmount(tx);
      const date = toDate(tx.rawDate);
      if (amount <= 0) return;
      if (amount > largest) largest = amount;
      if (date) {
        weekdayTotals[date.getDay()] += amount;
        if (date.getDay() === 0 || date.getDay() === 6) weekend += amount;
        const hour = date.getHours();
        const partIndex = hour < 12 ? 0 : hour < 17 ? 1 : hour < 22 ? 2 : 3;
        parts[partIndex].amount += amount;
      }
    });

    const topCategory = categories[0];
    const topShare = total > 0 && topCategory ? topCategory.amount / total : 0;
    const weekendShare = total > 0 ? weekend / total : 0;
    const peak = parts.reduce((best, part) => (part.amount > best.amount ? part : best), parts[0]);
    const peakShare = total > 0 ? peak.amount / total : 0;
    const busiestDay = weekdayTotals.reduce(
      (best, amount, index) => (amount > weekdayTotals[best] ? index : best),
      0,
    );
    const average = spending.length > 0 ? total / spending.length : 0;

    const traits: Trait[] = [
      {
        icon: 'pie-chart-outline',
        label: 'Spending style',
        value: topShare >= 0.35 ? 'Focused' : 'Diversified',
        detail: topCategory
          ? `${Math.round(topShare * 100)}% in ${topCategory.name}`
          : 'No spending yet',
      },
      {
        icon: 'calendar-outline',
        label: 'Rhythm',
        value: weekendShare >= 0.45 ? 'Weekend-heavy' : 'Weekday-led',
        detail: `${Math.round(weekendShare * 100)}% on weekends`,
      },
      {
        icon: 'time-outline',
        label: 'Peak time',
        value: peak.name,
        detail: `${Math.round(peakShare * 100)}% of spending`,
      },
      {
        icon: 'trending-up',
        label: 'Busiest day',
        value: `${WEEKDAYS_LONG[busiestDay]}s`,
        detail: `${formatAmount(weekdayTotals[busiestDay], currency)} spent`,
      },
    ];

    return {
      traits,
      average,
      count: spending.length,
      largest,
    };
  }, [spending, categories, total, currency]);

  const periodLabel = PERIODS.find((item) => item.value === period)?.label ?? '';

  return (
    <Screen
      title="Expense DNA"
      icon="git-network-outline"
      refreshing={refreshing}
      onRefresh={refetch}
    >
      <View style={styles.segments}>
        {PERIODS.map((item) => {
          const active = period === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => setPeriod(item.value)}
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

      {total <= 0 && !loading ? (
        <EmptyState
          icon="git-network-outline"
          title="No expense DNA yet"
          message="Add a few expenses to reveal your spending personality."
        />
      ) : (
        <>
          <Card style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroTitleWrap}>
                <AppText variant="h3">Your expense DNA</AppText>
                <AppText variant="caption">
                  {profile.count} transactions · {periodLabel}
                </AppText>
              </View>
              <View style={styles.heroBadge}>
                <Ionicons name="git-network" size={22} color={colors.primary} />
              </View>
            </View>

            <ExpenseDnaChart data={genes} height={198} />

            <View style={styles.legendWrap}>
              {genes.map((gene) => (
                <View key={gene.name} style={styles.legendChip}>
                  <View style={[styles.legendDot, { backgroundColor: gene.color }]} />
                  <AppText variant="caption" numberOfLines={1}>
                    {gene.name}
                  </AppText>
                </View>
              ))}
            </View>
          </Card>

          <View style={styles.sectionHeader}>
            <AppText variant="h3">Your traits</AppText>
            <AppText variant="caption">Habits behind the numbers</AppText>
          </View>

          <View style={styles.traitsGrid}>
            {profile.traits.map((trait) => (
              <Card key={trait.label} style={styles.traitCard}>
                <View style={styles.traitIcon}>
                  <Ionicons name={trait.icon} size={20} color={colors.primary} />
                </View>
                <AppText variant="caption">{trait.label}</AppText>
                <AppText variant="h3" numberOfLines={1} adjustsFontSizeToFit>
                  {trait.value}
                </AppText>
                <AppText variant="caption" numberOfLines={2}>
                  {trait.detail}
                </AppText>
              </Card>
            ))}
          </View>

          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <AppText variant="caption">Total spent</AppText>
                <AppText variant="label" color={colors.danger} numberOfLines={1} adjustsFontSizeToFit>
                  {currency} {formatAmount(total, currency)}
                </AppText>
              </View>
              <View style={styles.statItem}>
                <AppText variant="caption">Average</AppText>
                <AppText variant="label" numberOfLines={1} adjustsFontSizeToFit>
                  {currency} {formatAmount(profile.average, currency)}
                </AppText>
              </View>
              <View style={styles.statItem}>
                <AppText variant="caption">Biggest</AppText>
                <AppText variant="label" numberOfLines={1} adjustsFontSizeToFit>
                  {currency} {formatAmount(profile.largest, currency)}
                </AppText>
              </View>
            </View>
          </Card>

          <View style={styles.sectionHeader}>
            <AppText variant="h3">Category genes</AppText>
            <AppText variant="caption">{genes.length} groups</AppText>
          </View>

          <Card style={styles.categoryCard}>
            {genes.map((gene) => {
              const percent = total > 0 ? Math.round((gene.value / total) * 100) : 0;
              return (
                <View key={gene.name} style={styles.categoryRow}>
                  <View style={styles.categoryTop}>
                    <View style={[styles.legendDot, { backgroundColor: gene.color }]} />
                    <AppText variant="label" numberOfLines={1} style={styles.categoryName}>
                      {gene.name}
                    </AppText>
                    <AppText variant="caption" style={styles.categoryPercent}>
                      {percent}%
                    </AppText>
                    <AppText variant="label" numberOfLines={1}>
                      {currency} {formatAmount(gene.value, currency)}
                    </AppText>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${percent}%`, backgroundColor: gene.color },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </Card>
        </>
      )}

      <Loader visible={loading && !data} message="Reading your expense DNA..." />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    segments: {
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
    heroCard: { marginBottom: Spacing.lg },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    heroTitleWrap: { flex: 1 },
    heroBadge: {
      width: 42,
      height: 42,
      borderRadius: Radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    legendWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    legendChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: Radius.pill,
      backgroundColor: colors.surfaceAlt,
      maxWidth: '48%',
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: Radius.pill,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    traitsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    traitCard: {
      flexGrow: 1,
      flexBasis: '46%',
      gap: 2,
      minWidth: 0,
    },
    traitIcon: {
      width: 38,
      height: 38,
      borderRadius: Radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    statsCard: { marginBottom: Spacing.lg },
    statsRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    statItem: { flex: 1, gap: 2, minWidth: 0 },
    categoryCard: { gap: Spacing.lg },
    categoryRow: { gap: Spacing.sm },
    categoryTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    categoryName: { flex: 1 },
    categoryPercent: {
      minWidth: 38,
      textAlign: 'right',
    },
    progressTrack: {
      height: 6,
      borderRadius: Radius.pill,
      backgroundColor: colors.surfaceAlt,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: Radius.pill,
    },
  });

export default ExpenseDnaScreen;
