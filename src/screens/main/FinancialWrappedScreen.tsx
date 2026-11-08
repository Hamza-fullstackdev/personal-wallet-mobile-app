import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ComponentRef,
} from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import {
  AppText,
  Banner,
  Button,
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
  MONTHS_SHORT,
  WEEKDAYS_LONG,
  incomeAmount,
  isExpenseTransaction,
  monthRange,
  spendingAmount,
  startOfYear,
  toDate,
  transactionCategory,
  yearRange,
} from '../../utils/analytics';
import { formatAmount, formatDate } from '../../utils/format';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const MUTED_ON_GRADIENT = 'rgba(255,255,255,0.72)';

interface CategoryTotal {
  name: string;
  amount: number;
  count: number;
}

interface MonthTotal {
  short: string;
  amount: number;
}

function categoryTotals(
  transactions: StatementTransaction[],
): CategoryTotal[] {
  const map = new Map<string, CategoryTotal>();
  transactions.forEach((tx) => {
    const amount = spendingAmount(tx);
    if (amount <= 0) return;
    const name = transactionCategory(tx);
    const existing = map.get(name);
    if (existing) {
      existing.amount += amount;
      existing.count += 1;
    } else {
      map.set(name, { name, amount, count: 1 });
    }
  });
  return Array.from(map.values()).sort(
    (a, b) => b.amount - a.amount || a.name.localeCompare(b.name),
  );
}

export function FinancialWrappedScreen() {
  const { colors, gradients } = useTheme();
  const styles = useThemedStyles(createStyles);
  const currency = useAuthStore((state) => state.user?.currency ?? 'PKR');

  const [yearAnchor, setYearAnchor] = useState(() => startOfYear(new Date()));
  const [sharing, setSharing] = useState(false);
  const wrappedRef = useRef<ComponentRef<typeof View>>(null);

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

  const stats = useMemo(() => {
    const spending = transactions.filter(isExpenseTransaction);
    const income = transactions.reduce((sum, tx) => sum + incomeAmount(tx), 0);
    const spent = spending.reduce((sum, tx) => sum + spendingAmount(tx), 0);
    const saved = income - spent;
    const savingsRate = income > 0 ? Math.round((saved / income) * 100) : 0;

    const categories = categoryTotals(spending);
    const topCategory = categories[0];
    const topShare =
      spent > 0 && topCategory ? topCategory.amount / spent : 0;

    const frequent = categories.reduce<CategoryTotal | null>((best, group) => {
      if (!best) return group;
      return group.count > best.count ? group : best;
    }, null);

    const biggest = spending.reduce<StatementTransaction | null>((best, tx) => {
      if (!best) return tx;
      return spendingAmount(tx) > spendingAmount(best) ? tx : best;
    }, null);

    const monthBuckets: MonthTotal[] = Array.from({ length: 12 }, (_, index) => {
      const bucketRange = monthRange(
        new Date(yearAnchor.getFullYear(), index, 1),
      );
      const amount = spending.reduce((sum, tx) => {
        const date = toDate(tx.rawDate);
        if (!date || date < bucketRange.start || date > bucketRange.end) {
          return sum;
        }
        return sum + spendingAmount(tx);
      }, 0);
      return {
        short: MONTHS_SHORT[index],
        amount,
      };
    });

    const busiestMonth = monthBuckets.reduce(
      (best, month) => (month.amount > best.amount ? month : best),
      monthBuckets[0],
    );

    const weekdayTotals = Array.from({ length: 7 }, () => 0);
    spending.forEach((tx) => {
      const date = toDate(tx.rawDate);
      if (!date) return;
      weekdayTotals[date.getDay()] += spendingAmount(tx);
    });
    const busiestDay = weekdayTotals.reduce(
      (best, amount, index) => (amount > weekdayTotals[best] ? index : best),
      0,
    );

    const today = new Date();
    const isCurrentYear = yearAnchor.getFullYear() === today.getFullYear();
    const elapsedEnd = isCurrentYear ? today : new Date(yearAnchor.getFullYear(), 11, 31);
    const elapsedDays = Math.max(
      1,
      Math.ceil(
        (elapsedEnd.getTime() - range.start.getTime()) / (24 * 60 * 60 * 1000),
      ) + 1,
    );
    const averageDaily = spent / elapsedDays;

    const biggestTitle = biggest
      ? biggest.title?.trim() || transactionCategory(biggest)
      : '';

    return {
      income,
      spent,
      saved,
      savingsRate,
      expenseCount: spending.length,
      categoryCount: categories.length,
      topCategory,
      topShare,
      frequent,
      biggest,
      biggestTitle,
      busiestMonth,
      busiestDay,
      averageDaily,
      monthBuckets,
    };
  }, [transactions, yearAnchor, range.start]);

  const changeYear = (delta: number) => {
    setYearAnchor(new Date(yearAnchor.getFullYear() + delta, 0, 1));
  };

  const handleShare = async () => {
    if (sharing || !wrappedRef.current) return;

    setSharing(true);
    try {
      const uri = await captureRef(wrappedRef.current, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(
          'Sharing unavailable',
          'This device cannot open the share sheet right now.',
        );
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `My Financial Wrapped ${yearAnchor.getFullYear()}`,
        UTI: 'public.png',
      });
    } catch (shareError) {
      Alert.alert(
        'Unable to share',
        shareError instanceof Error
          ? shareError.message
          : 'Please try again.',
      );
    } finally {
      setSharing(false);
    }
  };

  const hasData = stats.income > 0 || stats.spent > 0;

  return (
    <Screen
      title="Wrapped"
      icon="film-outline"
      refreshing={refreshing}
      onRefresh={refetch}
    >
      {error ? <Banner message={error} type="error" /> : null}

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
              {yearAnchor.getFullYear()} in review
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
      </Card>

      {!hasData && !loading ? (
        <EmptyState
          icon="film-outline"
          title="No story yet"
          message="Add income and expenses this year to create your Financial Wrapped."
        />
      ) : (
        <>
          <View ref={wrappedRef} collapsable={false} style={styles.captureWrap}>
            <LinearGradient
              colors={gradients.brand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.wrappedCard}
            >
              <View style={styles.brandRow}>
                <View style={styles.logoCircle}>
                  <Ionicons name="wallet" size={20} color={colors.onPrimary} />
                </View>
                <View style={styles.brandText}>
                  <AppText variant="label" color={colors.onPrimary}>
                    Personal Wallet
                  </AppText>
                  <AppText variant="caption" color={MUTED_ON_GRADIENT}>
                    Financial Wrapped
                  </AppText>
                </View>
                <AppText variant="h2" color={colors.onPrimary}>
                  {yearAnchor.getFullYear()}
                </AppText>
              </View>

              <View style={styles.heroBlock}>
                <AppText variant="caption" color={MUTED_ON_GRADIENT}>
                  You spent
                </AppText>
                <AppText
                  variant="display"
                  color={colors.onPrimary}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                >
                  {currency} {formatAmount(stats.spent, currency)}
                </AppText>
                <AppText variant="label" color={MUTED_ON_GRADIENT}>
                  across {stats.expenseCount} expenses in {yearAnchor.getFullYear()}
                </AppText>
              </View>

              <View style={styles.wrappedGrid}>
                <View style={styles.gridCell}>
                  <AppText variant="caption" color={MUTED_ON_GRADIENT}>
                    You kept
                  </AppText>
                  <AppText
                    variant="h3"
                    color={colors.onPrimary}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {currency} {formatAmount(stats.saved, currency)}
                  </AppText>
                  <AppText variant="caption" color={MUTED_ON_GRADIENT}>
                    {Math.max(0, stats.savingsRate)}% of income
                  </AppText>
                </View>
                <View style={styles.gridCell}>
                  <AppText variant="caption" color={MUTED_ON_GRADIENT}>
                    Top category
                  </AppText>
                  <AppText
                    variant="h3"
                    color={colors.onPrimary}
                    numberOfLines={1}
                  >
                    {stats.topCategory?.name ?? '—'}
                  </AppText>
                  <AppText variant="caption" color={MUTED_ON_GRADIENT}>
                    {Math.round(stats.topShare * 100)}% of spending
                  </AppText>
                </View>
                <View style={styles.gridCell}>
                  <AppText variant="caption" color={MUTED_ON_GRADIENT}>
                    Busiest month
                  </AppText>
                  <AppText variant="h3" color={colors.onPrimary}>
                    {stats.busiestMonth.short}
                  </AppText>
                  <AppText variant="caption" color={MUTED_ON_GRADIENT}>
                    {currency} {formatAmount(stats.busiestMonth.amount, currency)}
                  </AppText>
                </View>
                <View style={styles.gridCell}>
                  <AppText variant="caption" color={MUTED_ON_GRADIENT}>
                    Busiest day
                  </AppText>
                  <AppText variant="h3" color={colors.onPrimary}>
                    {stats.spent > 0
                      ? `${WEEKDAYS_LONG[stats.busiestDay]}s`
                      : '—'}
                  </AppText>
                  <AppText variant="caption" color={MUTED_ON_GRADIENT}>
                    Your heaviest spending day
                  </AppText>
                </View>
              </View>

              {stats.biggest ? (
                <View style={styles.biggestBlock}>
                  <Ionicons
                    name="sparkles"
                    size={18}
                    color={colors.onPrimary}
                  />
                  <View style={styles.biggestText}>
                    <AppText variant="caption" color={MUTED_ON_GRADIENT}>
                      Biggest purchase
                    </AppText>
                    <AppText
                      variant="label"
                      color={colors.onPrimary}
                      numberOfLines={1}
                    >
                      {stats.biggestTitle}
                    </AppText>
                  </View>
                  <View style={styles.biggestAmount}>
                    <AppText
                      variant="label"
                      color={colors.onPrimary}
                      numberOfLines={1}
                    >
                      {currency} {formatAmount(stats.biggest.amount, currency)}
                    </AppText>
                    <AppText variant="caption" color={MUTED_ON_GRADIENT}>
                      {formatDate(stats.biggest.rawDate)}
                    </AppText>
                  </View>
                </View>
              ) : null}

              <View style={styles.wrappedFooter}>
                <AppText variant="caption" color={MUTED_ON_GRADIENT}>
                  Your money story, {yearAnchor.getFullYear()}
                </AppText>
                <AppText variant="caption" color={MUTED_ON_GRADIENT}>
                  personal-wallet
                </AppText>
              </View>
            </LinearGradient>
          </View>

          <Button
            title="Share wrapped"
            icon="share-social-outline"
            loading={sharing}
            onPress={handleShare}
            style={styles.shareButton}
          />
          <AppText variant="caption" center style={styles.shareHint}>
            Creates a shareable image of the card above.
          </AppText>

          <Card style={styles.highlightsCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <AppText variant="h3">Year highlights</AppText>
                <AppText variant="caption">
                  The moments that shaped your money
                </AppText>
              </View>
              <View style={styles.headerIcon}>
                <Ionicons
                  name="sparkles-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
            </View>

            <HighlightRow
              icon="trending-up-outline"
              label="Total income"
              value={`${currency} ${formatAmount(stats.income, currency)}`}
              color={colors.success}
            />
            <HighlightRow
              icon="trending-down-outline"
              label="Total spending"
              value={`${currency} ${formatAmount(stats.spent, currency)}`}
              color={colors.danger}
            />
            <HighlightRow
              icon="repeat-outline"
              label="Most frequent category"
              value={
                stats.frequent
                  ? `${stats.frequent.name} · ${stats.frequent.count}x`
                  : 'No spending yet'
              }
            />
            <HighlightRow
              icon="grid-outline"
              label="Categories used"
              value={`${stats.categoryCount}`}
            />
            <HighlightRow
              icon="calendar-outline"
              label="Average daily spend"
              value={`${currency} ${formatAmount(
                stats.averageDaily,
                currency,
              )}`}
            />
            <HighlightRow
              icon="wallet-outline"
              label="Expenses recorded"
              value={`${stats.expenseCount} transactions`}
              last
            />
          </Card>

          <View
            style={[
              styles.insightCard,
              {
                backgroundColor:
                  stats.savingsRate >= 20 ? colors.successFaint : colors.surfaceAlt,
                borderColor:
                  stats.savingsRate >= 20 ? colors.successSoft : colors.divider,
              },
            ]}
          >
            <Ionicons
              name={stats.savingsRate >= 20 ? 'trophy-outline' : 'information-circle'}
              size={20}
              color={stats.savingsRate >= 20 ? colors.success : colors.textSecondary}
            />
            <AppText variant="caption" style={styles.insightText}>
              {stats.savingsRate >= 20
                ? `You saved ${stats.savingsRate}% of your income this year. That is a strong finish.`
                : stats.savingsRate >= 0
                  ? `You saved ${stats.savingsRate}% of your income this year. Small trims could push it higher.`
                  : 'Spending grew past income this year. A fresh plan can turn the next chapter around.'}
            </AppText>
          </View>
        </>
      )}

      <Loader visible={loading && !data} message="Writing your money story..." />
    </Screen>
  );
}

interface HighlightRowProps {
  icon: IoniconName;
  label: string;
  value: string;
  color?: string;
  last?: boolean;
}

function HighlightRow({ icon, label, value, color, last }: HighlightRowProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  return (
    <View style={[styles.highlightRow, last ? styles.highlightRowLast : null]}>
      <View style={styles.highlightIcon}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <AppText variant="caption" style={styles.highlightLabel}>
        {label}
      </AppText>
      <AppText
        variant="label"
        color={color ?? colors.textPrimary}
        style={styles.highlightValue}
        numberOfLines={1}
      >
        {value}
      </AppText>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    navCard: { marginBottom: Spacing.lg },
    navHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    navButton: {
      width: 36,
      height: 36,
      borderRadius: Radius.pill,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    captureWrap: {
      borderRadius: Radius.xl,
      overflow: 'hidden',
      marginBottom: Spacing.lg,
    },
    wrappedCard: {
      padding: Spacing.xl,
      gap: Spacing.lg,
    },
    brandRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    logoCircle: {
      width: 40,
      height: 40,
      borderRadius: Radius.pill,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandText: { flex: 1 },
    heroBlock: { gap: 2, paddingVertical: Spacing.sm },
    wrappedGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    gridCell: {
      flexGrow: 1,
      flexBasis: '46%',
      gap: 2,
      padding: Spacing.md,
      borderRadius: Radius.md,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.16)',
      minWidth: 0,
    },
    biggestBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      padding: Spacing.md,
      borderRadius: Radius.md,
      backgroundColor: 'rgba(0,0,0,0.14)',
    },
    biggestText: { flex: 1, minWidth: 0 },
    biggestAmount: { alignItems: 'flex-end' },
    wrappedFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.18)',
    },
    shareButton: { marginBottom: Spacing.sm },
    shareHint: { marginBottom: Spacing.lg },
    highlightsCard: { marginBottom: Spacing.lg },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    cardHeaderText: { flex: 1 },
    headerIcon: {
      width: 38,
      height: 38,
      borderRadius: Radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    highlightRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    highlightRowLast: { borderBottomWidth: 0 },
    highlightIcon: {
      width: 30,
      height: 30,
      borderRadius: Radius.sm,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    highlightLabel: { flex: 1 },
    highlightValue: { maxWidth: '55%', textAlign: 'right' },
    insightCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      padding: Spacing.lg,
      borderRadius: Radius.lg,
      borderWidth: 1,
    },
    insightText: { flex: 1 },
  });

export default FinancialWrappedScreen;
