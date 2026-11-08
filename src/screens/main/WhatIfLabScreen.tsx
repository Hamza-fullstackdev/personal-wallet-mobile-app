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
import { useStatementData } from '../../hooks/useStatement';
import { useAuthStore } from '../../store/authStore';
import { Radius, Spacing, type ThemeColors } from '../../theme';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import type { StatementTransaction } from '../../types';
import {
  addMonths,
  incomeAmount,
  isExpenseTransaction,
  monthLabel,
  monthRange,
  spendingAmount,
  startOfMonth,
  transactionCategory,
} from '../../utils/analytics';
import { formatAmount } from '../../utils/format';

const ESSENTIAL_KEYWORDS = [
  'rent',
  'bill',
  'utilit',
  'grocer',
  'health',
  'medic',
  'insur',
  'transport',
  'commut',
  'fuel',
  'loan',
  'debt',
  'tax',
  'education',
  'school',
  'fee',
];

const TRIM_PRESETS = [0, 10, 20, 30, 40];

interface CategoryGroup {
  name: string;
  amount: number;
  essential: boolean;
}

function isEssential(name: string): boolean {
  const normalized = name.toLowerCase();
  return ESSENTIAL_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function groupCategories(
  transactions: StatementTransaction[],
): CategoryGroup[] {
  const totals = new Map<string, number>();
  transactions.forEach((tx) => {
    const amount = spendingAmount(tx);
    if (amount <= 0) return;
    const name = transactionCategory(tx);
    totals.set(name, (totals.get(name) ?? 0) + amount);
  });
  return Array.from(totals, ([name, amount]) => ({
    name,
    amount,
    essential: isEssential(name),
  })).sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
}

export function WhatIfLabScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const currency = useAuthStore((state) => state.user?.currency ?? 'PKR');

  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));
  const [trim, setTrim] = useState(15);
  const [cutTop, setCutTop] = useState(false);

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

  const transactions = data?.transactions ?? [];

  const income = useMemo(
    () => transactions.reduce((sum, tx) => sum + incomeAmount(tx), 0),
    [transactions],
  );

  const categories = useMemo(
    () => groupCategories(transactions.filter(isExpenseTransaction)),
    [transactions],
  );

  const flexible = useMemo(
    () => categories.filter((group) => !group.essential),
    [categories],
  );

  const topFlexible = flexible[0];

  const model = useMemo(() => {
    const flexibleTotal = flexible.reduce((sum, group) => sum + group.amount, 0);
    const essentialTotal = categories.reduce(
      (sum, group) => (group.essential ? sum + group.amount : sum),
      0,
    );
    const baselineSpending = flexibleTotal + essentialTotal;
    const trimSavings = flexibleTotal * (trim / 100);
    const cutSavings =
      cutTop && topFlexible ? topFlexible.amount * (1 - trim / 100) : 0;
    const projectedSpending = Math.max(
      0,
      baselineSpending - trimSavings - cutSavings,
    );
    const baselineSavings = income - baselineSpending;
    const projectedSavings = income - projectedSpending;
    const extraSaved = baselineSpending - projectedSpending;

    const projectedCategories = categories.map((group) => {
      let projected = group.amount;
      if (!group.essential) {
        projected *= 1 - trim / 100;
        if (cutTop && topFlexible && group.name === topFlexible.name) {
          projected = 0;
        }
      }
      return {
        ...group,
        projected,
        saved: group.amount - projected,
      };
    });

    return {
      flexibleTotal,
      essentialTotal,
      baselineSpending,
      trimSavings,
      cutSavings,
      projectedSpending,
      baselineSavings,
      projectedSavings,
      extraSaved,
      projectedCategories,
    };
  }, [categories, flexible, trim, cutTop, topFlexible, income]);

  const maxReference = Math.max(
    1,
    income,
    model.baselineSpending,
    model.projectedSpending,
  );

  const changeMonth = (delta: number) => {
    setAnchor((previous) => addMonths(previous, delta));
  };

  const adjustTrim = (delta: number) => {
    setTrim((previous) => Math.min(60, Math.max(0, previous + delta)));
  };

  const savingsShare =
    income > 0 ? Math.round((model.projectedSavings / income) * 100) : 0;

  const insight =
    model.baselineSpending <= 0
      ? 'Add some spending to this month to start experimenting.'
      : model.extraSaved <= 0
        ? 'Nudge the levers to see how much breathing room you could create.'
        : income > 0
          ? `You would keep ${currency} ${formatAmount(
              model.extraSaved,
              currency,
            )} more — about ${Math.max(0, savingsShare)}% of your income.`
          : `You would spend ${currency} ${formatAmount(
              model.extraSaved,
              currency,
            )} less this month. Record income to see savings impact.`;

  return (
    <Screen
      title="What-If Lab"
      icon="flask-outline"
      refreshing={refreshing}
      onRefresh={refetch}
    >
      {error ? <Banner message={error} type="error" /> : null}

      <Card style={styles.navCard}>
        <View style={styles.navHeader}>
          <Pressable
            onPress={() => changeMonth(-1)}
            hitSlop={10}
            style={styles.navButton}
          >
            <Ionicons name="chevron-back" size={20} color={colors.primaryDeep} />
          </Pressable>
          <Pressable
            onPress={() => setAnchor(startOfMonth(new Date()))}
            hitSlop={8}
          >
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
        <View style={styles.navStats}>
          <View style={styles.navStat}>
            <AppText variant="caption">Income</AppText>
            <AppText variant="label" color={colors.success} numberOfLines={1}>
              {currency} {formatAmount(income, currency)}
            </AppText>
          </View>
          <View style={styles.navStat}>
            <AppText variant="caption">Flexible spend</AppText>
            <AppText variant="label" numberOfLines={1}>
              {currency} {formatAmount(model.flexibleTotal, currency)}
            </AppText>
          </View>
        </View>
      </Card>

      {model.baselineSpending <= 0 && income <= 0 && !loading ? (
        <EmptyState
          icon="flask-outline"
          title="Lab is idle"
          message="Add income and expenses to this month to run simulations."
        />
      ) : (
        <>
          <Card style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.heroText}>
                <AppText variant="caption">Projected savings</AppText>
                <AppText
                  variant="h1"
                  color={
                    model.projectedSavings >= 0
                      ? colors.success
                      : colors.danger
                  }
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {currency} {formatAmount(model.projectedSavings, currency)}
                </AppText>
              </View>
              <View
                style={[
                  styles.deltaPill,
                  {
                    backgroundColor:
                      model.extraSaved > 0
                        ? colors.successSoft
                        : colors.surfaceAlt,
                  },
                ]}
              >
                <Ionicons
                  name={model.extraSaved > 0 ? 'trending-up' : 'remove'}
                  size={14}
                  color={
                    model.extraSaved > 0
                      ? colors.success
                      : colors.textMuted
                  }
                />
                <AppText
                  variant="caption"
                  color={
                    model.extraSaved > 0
                      ? colors.success
                      : colors.textMuted
                  }
                >
                  {model.extraSaved > 0 ? '+' : ''}
                  {formatAmount(model.extraSaved, currency)} kept
                </AppText>
              </View>
            </View>

            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <AppText variant="caption">Current spend</AppText>
                <AppText variant="label" numberOfLines={1}>
                  {formatAmount(model.baselineSpending, currency)}
                </AppText>
              </View>
              <View style={styles.heroStat}>
                <AppText variant="caption">After changes</AppText>
                <AppText
                  variant="label"
                  color={colors.primary}
                  numberOfLines={1}
                >
                  {formatAmount(model.projectedSpending, currency)}
                </AppText>
              </View>
              <View style={styles.heroStat}>
                <AppText variant="caption">Cut</AppText>
                <AppText variant="label" color={colors.success} numberOfLines={1}>
                  {formatAmount(model.extraSaved, currency)}
                </AppText>
              </View>
            </View>
          </Card>

          <Card style={styles.controlsCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <AppText variant="h3">Adjust the levers</AppText>
                <AppText variant="caption">
                  Fine-tune your experiment
                </AppText>
              </View>
              <View style={styles.headerIcon}>
                <Ionicons name="flask" size={20} color={colors.primary} />
              </View>
            </View>

            <View style={styles.leverHeader}>
              <View style={styles.leverText}>
                <AppText variant="label">Trim flexible spending</AppText>
                <AppText variant="caption">
                  Essentials like rent, bills and groceries stay protected.
                </AppText>
              </View>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => adjustTrim(-5)}
                  disabled={trim <= 0}
                  hitSlop={6}
                  style={[
                    styles.stepButton,
                    trim <= 0 ? styles.stepButtonDisabled : null,
                  ]}
                >
                  <Ionicons
                    name="remove"
                    size={16}
                    color={trim <= 0 ? colors.textMuted : colors.primaryDeep}
                  />
                </Pressable>
                <AppText variant="h3" style={styles.stepValue}>
                  {trim}%
                </AppText>
                <Pressable
                  onPress={() => adjustTrim(5)}
                  disabled={trim >= 60}
                  hitSlop={6}
                  style={[
                    styles.stepButton,
                    trim >= 60 ? styles.stepButtonDisabled : null,
                  ]}
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color={trim >= 60 ? colors.textMuted : colors.primaryDeep}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.presetRow}>
              {TRIM_PRESETS.map((preset) => {
                const active = trim === preset;
                return (
                  <Pressable
                    key={preset}
                    onPress={() => setTrim(preset)}
                    style={[
                      styles.presetChip,
                      active ? styles.presetChipActive : null,
                    ]}
                  >
                    <AppText
                      variant="caption"
                      weight="semiBold"
                      color={active ? colors.onPrimary : colors.textSecondary}
                    >
                      {preset}%
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.divider} />

            <Pressable
              onPress={() => setCutTop((previous) => !previous)}
              style={styles.toggleRow}
            >
              <View
                style={[
                  styles.toggleIcon,
                  cutTop ? { backgroundColor: colors.primary } : null,
                ]}
              >
                <Ionicons
                  name={cutTop ? 'checkmark' : 'remove'}
                  size={16}
                  color={cutTop ? colors.onPrimary : colors.textMuted}
                />
              </View>
              <View style={styles.toggleText}>
                <AppText variant="label">Cut top flexible category</AppText>
                <AppText variant="caption" numberOfLines={1}>
                  {topFlexible
                    ? `${topFlexible.name} · ${currency} ${formatAmount(
                        topFlexible.amount,
                        currency,
                      )}`
                    : 'No flexible spending found'}
                </AppText>
              </View>
              <Ionicons
                name={cutTop ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={cutTop ? colors.primary : colors.textMuted}
              />
            </Pressable>

            <View style={styles.savingsSummary}>
              <View style={styles.savingsItem}>
                <AppText variant="caption">From trimming</AppText>
                <AppText variant="label" color={colors.success}>
                  {currency} {formatAmount(model.trimSavings, currency)}
                </AppText>
              </View>
              <View style={styles.savingsItem}>
                <AppText variant="caption">From cutting</AppText>
                <AppText variant="label" color={colors.success}>
                  {currency} {formatAmount(model.cutSavings, currency)}
                </AppText>
              </View>
            </View>
          </Card>

          <Card style={styles.compareCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <AppText variant="h3">Spending comparison</AppText>
                <AppText variant="caption">Before and after your changes</AppText>
              </View>
            </View>

            <CompareBar
              label="Income"
              value={income}
              percent={(income / maxReference) * 100}
              color={colors.success}
              currency={currency}
            />
            <CompareBar
              label="Current spending"
              value={model.baselineSpending}
              percent={(model.baselineSpending / maxReference) * 100}
              color={colors.danger}
              currency={currency}
            />
            <CompareBar
              label="Projected spending"
              value={model.projectedSpending}
              percent={(model.projectedSpending / maxReference) * 100}
              color={colors.primary}
              currency={currency}
            />
          </Card>

          <Card style={styles.breakdownCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <AppText variant="h3">Category impact</AppText>
                <AppText variant="caption">
                  Essentials marked as fixed
                </AppText>
              </View>
            </View>

            {model.projectedCategories.slice(0, 7).map((group) => (
              <View key={group.name} style={styles.categoryRow}>
                <View
                  style={[
                    styles.categoryDot,
                    {
                      backgroundColor: group.essential
                        ? colors.textMuted
                        : colors.primary,
                    },
                  ]}
                />
                <View style={styles.categoryText}>
                  <View style={styles.categoryTop}>
                    <AppText
                      variant="label"
                      numberOfLines={1}
                      style={styles.categoryName}
                    >
                      {group.name}
                    </AppText>
                    {group.essential ? (
                      <View style={styles.fixedChip}>
                        <AppText variant="caption">Fixed</AppText>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.categoryAmounts}>
                    <AppText variant="caption">
                      {currency} {formatAmount(group.projected, currency)}
                    </AppText>
                    {group.saved > 0.5 ? (
                      <AppText variant="caption" color={colors.success}>
                        − {formatAmount(group.saved, currency)}
                      </AppText>
                    ) : null}
                  </View>
                </View>
                <AppText variant="label" numberOfLines={1}>
                  {formatAmount(group.amount, currency)}
                </AppText>
              </View>
            ))}

            {model.projectedCategories.length > 7 ? (
              <AppText variant="caption">
                +{model.projectedCategories.length - 7} more categories
              </AppText>
            ) : null}
          </Card>

          <View
            style={[
              styles.insightCard,
              {
                backgroundColor:
                  model.extraSaved > 0 ? colors.successFaint : colors.surfaceAlt,
                borderColor:
                  model.extraSaved > 0 ? colors.successSoft : colors.divider,
              },
            ]}
          >
            <Ionicons
              name={model.extraSaved > 0 ? 'sparkles' : 'information-circle'}
              size={20}
              color={
                model.extraSaved > 0 ? colors.success : colors.textSecondary
              }
            />
            <AppText variant="caption" style={styles.insightText}>
              {insight}
            </AppText>
          </View>
        </>
      )}

      <Loader visible={loading && !data} message="Running simulations..." />
    </Screen>
  );
}

interface CompareBarProps {
  label: string;
  value: number;
  percent: number;
  color: string;
  currency: string;
}

function CompareBar({ label, value, percent, color, currency }: CompareBarProps) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.compareRow}>
      <View style={styles.compareTop}>
        <AppText variant="caption">{label}</AppText>
        <AppText variant="label">
          {currency} {formatAmount(value, currency)}
        </AppText>
      </View>
      <View style={styles.compareTrack}>
        <View
          style={[
            styles.compareFill,
            {
              width: `${Math.min(100, Math.max(0, percent))}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
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
      marginBottom: Spacing.lg,
    },
    navButton: {
      width: 36,
      height: 36,
      borderRadius: Radius.pill,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navStats: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    navStat: { flex: 1, gap: 2, minWidth: 0 },
    heroCard: { marginBottom: Spacing.lg },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    heroText: { flex: 1, gap: 2, minWidth: 0 },
    deltaPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 6,
      borderRadius: Radius.pill,
    },
    heroStats: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    heroStat: { flex: 1, gap: 2, minWidth: 0 },
    controlsCard: { marginBottom: Spacing.lg },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
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
    leverHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    leverText: { flex: 1, gap: 2 },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.xs,
      paddingVertical: 4,
      borderRadius: Radius.pill,
      backgroundColor: colors.surfaceAlt,
    },
    stepButton: {
      width: 30,
      height: 30,
      borderRadius: Radius.pill,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepButtonDisabled: { opacity: 0.5 },
    stepValue: {
      minWidth: 48,
      textAlign: 'center',
    },
    presetRow: {
      flexDirection: 'row',
      gap: Spacing.xs,
      marginTop: Spacing.md,
    },
    presetChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 7,
      borderRadius: Radius.pill,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    presetChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: Spacing.lg,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    toggleIcon: {
      width: 32,
      height: 32,
      borderRadius: Radius.sm,
      backgroundColor: colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleText: { flex: 1, gap: 2, minWidth: 0 },
    savingsSummary: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.lg,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    savingsItem: { flex: 1, gap: 2 },
    compareCard: { marginBottom: Spacing.lg },
    compareRow: { gap: 6, marginBottom: Spacing.md },
    compareTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    compareTrack: {
      height: 10,
      borderRadius: Radius.pill,
      backgroundColor: colors.surfaceAlt,
      overflow: 'hidden',
    },
    compareFill: {
      height: '100%',
      borderRadius: Radius.pill,
    },
    breakdownCard: { marginBottom: Spacing.lg },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    categoryDot: {
      width: 10,
      height: 10,
      borderRadius: Radius.pill,
    },
    categoryText: { flex: 1, minWidth: 0, gap: 2 },
    categoryTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    categoryName: { flexShrink: 1 },
    fixedChip: {
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: Radius.pill,
      backgroundColor: colors.surfaceAlt,
    },
    categoryAmounts: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
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

export default WhatIfLabScreen;
