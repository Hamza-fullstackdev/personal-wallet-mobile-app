import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
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
import { BarChart, LineChart, PieChart } from '../../components/charts';
import { useStatementData } from '../../hooks/useStatement';
import { useAuthStore } from '../../store/authStore';
import { Radius, Spacing, type ThemeColors } from '../../theme';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { daysAgo, formatAmount, formatCurrency, toISODate } from '../../utils/format';
import {
  buildCashflowSeries,
  buildCategoryBreakdown,
  chartPalette,
  type CashflowBucketMode,
} from '../../utils/chartData';

type PeriodFilter = '7' | '30' | '90' | 'all';
type ChartType = 'line' | 'bar' | 'pie' | 'donut';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const PERIODS: { label: string; value: PeriodFilter }[] = [
  { label: '7 days', value: '7' },
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
  { label: 'All time', value: 'all' },
];

const CHART_TYPES: { label: string; value: ChartType; icon: IoniconName }[] = [
  { label: 'Line', value: 'line', icon: 'trending-up' },
  { label: 'Bars', value: 'bar', icon: 'bar-chart' },
  { label: 'Pie', value: 'pie', icon: 'pie-chart' },
  { label: 'Donut', value: 'donut', icon: 'disc' },
];

export function ChartsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { width } = useWindowDimensions();
  const currency = useAuthStore((state) => state.user?.currency ?? 'PKR');

  const [period, setPeriod] = useState<PeriodFilter>('30');
  const [chartType, setChartType] = useState<ChartType>('line');

  const rangeStart = useMemo(
    () => (period === 'all' ? null : daysAgo(Number(period))),
    [period],
  );
  const rangeEnd = useMemo(() => (period === 'all' ? null : new Date()), [period]);

  const query = useMemo(
    () => ({
      startDate: rangeStart ? toISODate(rangeStart) : undefined,
      endDate: rangeEnd ? toISODate(rangeEnd) : undefined,
    }),
    [rangeStart, rangeEnd],
  );

  const { data, loading, refreshing, error, refetch } = useStatementData(query);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const transactions = data?.transactions ?? [];
  const summary = data?.summary;

  const bucketMode: CashflowBucketMode =
    period === '90' ? 'week' : period === 'all' ? 'month' : 'day';

  const cashflow = useMemo(
    () =>
      buildCashflowSeries(
        transactions,
        bucketMode,
        rangeStart ?? undefined,
        rangeEnd ?? undefined,
      ),
    [transactions, bucketMode, rangeStart, rangeEnd],
  );

  const categories = useMemo(() => buildCategoryBreakdown(transactions), [transactions]);
  const palette = useMemo(() => chartPalette(colors), [colors]);
  const slices = useMemo(
    () =>
      categories.map((category, index) => ({
        ...category,
        color: palette[index % palette.length],
      })),
    [categories, palette],
  );
  const totalSpending = useMemo(
    () => categories.reduce((sum, category) => sum + category.value, 0),
    [categories],
  );

  const isDistribution = chartType === 'pie' || chartType === 'donut';
  const activeType = CHART_TYPES.find((item) => item.value === chartType) ?? CHART_TYPES[0];
  const pieSize = Math.min(260, Math.max(200, width - 96));
  const netFlow = summary?.netCashFlow ?? 0;

  return (
    <Screen
      title="Charts"
      icon="stats-chart-outline"
      refreshing={refreshing}
      onRefresh={refetch}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {PERIODS.map((item) => {
          const active = period === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => setPeriod(item.value)}
              style={[styles.chip, active ? styles.chipActive : null]}
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
      </ScrollView>

      <View style={styles.typeRow}>
        {CHART_TYPES.map((item) => {
          const active = chartType === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => setChartType(item.value)}
              style={({ pressed }) => [
                styles.typeTile,
                active ? styles.typeTileActive : null,
                pressed && !active ? styles.typeTilePressed : null,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={active ? colors.onPrimary : colors.primary}
              />
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

      {loading && !data ? (
        <Loader visible message="Loading charts..." />
      ) : error && !data ? (
        <EmptyState
          icon="stats-chart-outline"
          title="Charts unavailable"
          message="Pull down to retry loading your transaction data."
        />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon="stats-chart-outline"
          title="No transactions to chart"
          message="Add income, expenses, or investments in this period to see graphs."
        />
      ) : (
        <>
          {summary ? (
            <Card style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <AppText variant="caption">Money in</AppText>
                  <AppText
                    variant="label"
                    color={colors.success}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={styles.summaryValue}
                  >
                    {formatAmount(summary.totalCredit, currency)}
                  </AppText>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <AppText variant="caption">Money out</AppText>
                  <AppText
                    variant="label"
                    color={colors.danger}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={styles.summaryValue}
                  >
                    {formatAmount(summary.totalDebit, currency)}
                  </AppText>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <AppText variant="caption">Net flow</AppText>
                  <AppText
                    variant="label"
                    color={netFlow >= 0 ? colors.success : colors.danger}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={styles.summaryValue}
                  >
                    {netFlow >= 0 ? '+' : '-'}
                    {formatAmount(Math.abs(netFlow), currency)}
                  </AppText>
                </View>
              </View>
            </Card>
          ) : null}

          <Card style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View style={styles.chartTitleWrap}>
                <AppText variant="h3">
                  {isDistribution ? 'Spending by category' : 'Cash flow'}
                </AppText>
                <AppText variant="caption">
                  {isDistribution
                    ? 'Expenses and todo investments'
                    : 'Money in vs money out'}
                </AppText>
              </View>
              <View style={styles.chartBadge}>
                <Ionicons name={activeType.icon} size={20} color={colors.primary} />
              </View>
            </View>

            {isDistribution ? (
              slices.length === 0 ? (
                <EmptyState
                  icon="pie-chart-outline"
                  title="No spending in this period"
                  message="Expenses and todo investments will appear here."
                  style={styles.chartEmpty}
                />
              ) : (
                <>
                  <View style={styles.pieWrap}>
                    <PieChart
                      data={slices}
                      size={pieSize}
                      donut={chartType === 'donut'}
                      centerLabel="Total spent"
                      centerValue={formatCurrency(totalSpending, currency)}
                    />
                  </View>
                  <View style={styles.pieTotalRow}>
                    <AppText variant="caption">Total spent</AppText>
                    <AppText variant="label">
                      {formatCurrency(totalSpending, currency)}
                    </AppText>
                  </View>
                  <View style={styles.categoryLegend}>
                    {slices.map((slice) => {
                      const percent = totalSpending
                        ? Math.round((slice.value / totalSpending) * 100)
                        : 0;
                      return (
                        <View key={slice.name} style={styles.categoryRow}>
                          <View
                            style={[styles.legendDot, { backgroundColor: slice.color }]}
                          />
                          <AppText
                            variant="caption"
                            numberOfLines={1}
                            style={styles.categoryName}
                          >
                            {slice.name}
                          </AppText>
                          <AppText variant="caption" style={styles.categoryPercent}>
                            {percent}%
                          </AppText>
                          <AppText variant="label" numberOfLines={1}>
                            {formatCurrency(slice.value, currency)}
                          </AppText>
                        </View>
                      );
                    })}
                  </View>
                </>
              )
            ) : (
              <>
                {chartType === 'line' ? (
                  <LineChart data={cashflow} />
                ) : (
                  <BarChart data={cashflow} />
                )}
                <View style={styles.flowLegend}>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: colors.success }]}
                    />
                    <AppText variant="caption">Money in</AppText>
                  </View>
                  <View style={styles.legendItem}>
                    <View
                      style={[styles.legendDot, { backgroundColor: colors.danger }]}
                    />
                    <AppText variant="caption">Money out</AppText>
                  </View>
                </View>
              </>
            )}
          </Card>

          <AppText variant="caption" style={styles.footnote}>
            Cash flow counts every credit and debit. The spending chart excludes loans
            and transfers.
          </AppText>
        </>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    chips: { gap: Spacing.sm, paddingBottom: Spacing.lg },
    chip: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    typeRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    typeTile: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    typeTileActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    typeTilePressed: {
      backgroundColor: colors.primaryFaint,
    },
    summaryCard: {
      marginBottom: Spacing.lg,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    summaryItem: {
      flex: 1,
      gap: 2,
    },
    summaryValue: {
      marginTop: Spacing.xs,
    },
    summaryDivider: {
      width: 1,
      alignSelf: 'stretch',
      backgroundColor: colors.divider,
      marginHorizontal: Spacing.md,
    },
    chartCard: {
      marginBottom: Spacing.lg,
    },
    chartHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    chartTitleWrap: {
      flex: 1,
    },
    chartBadge: {
      width: 42,
      height: 42,
      borderRadius: Radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chartEmpty: {
      paddingVertical: Spacing.xl,
    },
    pieWrap: {
      alignItems: 'center',
      paddingVertical: Spacing.md,
    },
    pieTotalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.divider,
      marginBottom: Spacing.md,
    },
    categoryLegend: {
      gap: Spacing.md,
    },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    categoryName: {
      flex: 1,
    },
    categoryPercent: {
      minWidth: 38,
      textAlign: 'right',
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: Radius.pill,
    },
    flowLegend: {
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
    footnote: {
      color: colors.textMuted,
      textAlign: 'center',
    },
  });

export default ChartsScreen;
