import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MoneyRiver, type RiverNode } from '../../components/charts';
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
import { chartPalette } from '../../utils/chartData';
import { formatAmount } from '../../utils/format';

interface FlowGroup {
  name: string;
  amount: number;
}

const MAX_STREAMS = 5;

function groupByCategory(
  transactions: StatementTransaction[],
  amountOf: (tx: StatementTransaction) => number,
): FlowGroup[] {
  const totals = new Map<string, number>();
  transactions.forEach((tx) => {
    const amount = amountOf(tx);
    if (amount <= 0) return;
    const name = transactionCategory(tx);
    totals.set(name, (totals.get(name) ?? 0) + amount);
  });
  return Array.from(totals, ([name, amount]) => ({ name, amount })).sort(
    (a, b) => b.amount - a.amount || a.name.localeCompare(b.name),
  );
}

function buildNodes(
  groups: FlowGroup[],
  prefix: string,
  palette: string[],
  otherColor: string,
): RiverNode[] {
  const head = groups.slice(0, MAX_STREAMS).map((group, index) => ({
    id: `${prefix}-${index}-${group.name}`,
    name: group.name,
    value: group.amount,
    color: palette[index % palette.length],
  }));
  if (groups.length > MAX_STREAMS) {
    head.push({
      id: `${prefix}-other`,
      name: `Other · ${groups.length - MAX_STREAMS}`,
      value: groups
        .slice(MAX_STREAMS)
        .reduce((sum, group) => sum + group.amount, 0),
      color: otherColor,
    });
  }
  return head;
}

export function MoneyRiverScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const currency = useAuthStore((state) => state.user?.currency ?? 'PKR');

  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));
  const [chartWidth, setChartWidth] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const incomeGroups = useMemo(
    () =>
      groupByCategory(
        transactions.filter((tx) => tx.type === 'incoming'),
        incomeAmount,
      ),
    [transactions],
  );

  const expenseGroups = useMemo(
    () =>
      groupByCategory(
        transactions.filter(isExpenseTransaction),
        spendingAmount,
      ),
    [transactions],
  );

  const totalIncome = useMemo(
    () => incomeGroups.reduce((sum, group) => sum + group.amount, 0),
    [incomeGroups],
  );

  const totalExpense = useMemo(
    () => expenseGroups.reduce((sum, group) => sum + group.amount, 0),
    [expenseGroups],
  );

  const incomePalette = useMemo(
    () => [colors.success, colors.primaryLight, '#D97706', '#0F766E', '#8D6E63'],
    [colors],
  );
  const expensePalette = useMemo(() => chartPalette(colors), [colors]);

  const incomeNodes = useMemo(
    () => buildNodes(incomeGroups, 'in', incomePalette, colors.textMuted),
    [incomeGroups, incomePalette, colors.textMuted],
  );

  const expenseNodes = useMemo(
    () => buildNodes(expenseGroups, 'out', expensePalette, colors.textMuted),
    [expenseGroups, expensePalette, colors.textMuted],
  );

  const selected = useMemo(() => {
    const incomeNode = incomeNodes.find((node) => node.id === selectedId);
    if (incomeNode) {
      return { ...incomeNode, side: 'income' as const, total: totalIncome };
    }
    const expenseNode = expenseNodes.find((node) => node.id === selectedId);
    if (expenseNode) {
      return { ...expenseNode, side: 'expense' as const, total: totalExpense };
    }
    return null;
  }, [incomeNodes, expenseNodes, selectedId, totalIncome, totalExpense]);

  const net = totalIncome - totalExpense;
  const chartHeight = Math.max(
    240,
    Math.max(incomeNodes.length, expenseNodes.length, 2) * 46 + 84,
  );

  const changeMonth = (delta: number) => {
    setSelectedId(null);
    setAnchor((previous) => addMonths(previous, delta));
  };

  return (
    <Screen
      title="Money River"
      icon="git-branch-outline"
      refreshing={refreshing}
      onRefresh={refetch}
    >
      {error ? <Banner message={error} type="error" /> : null}

      <Card style={styles.summaryCard}>
        <View style={styles.navHeader}>
          <Pressable
            onPress={() => changeMonth(-1)}
            hitSlop={10}
            style={styles.navButton}
          >
            <Ionicons name="chevron-back" size={20} color={colors.primaryDeep} />
          </Pressable>
          <Pressable
            onPress={() => {
              setSelectedId(null);
              setAnchor(startOfMonth(new Date()));
            }}
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

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <AppText variant="caption">Money in</AppText>
            <AppText
              variant="label"
              color={colors.success}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {currency} {formatAmount(totalIncome, currency)}
            </AppText>
          </View>
          <View style={styles.summaryItem}>
            <AppText variant="caption">Money out</AppText>
            <AppText
              variant="label"
              color={colors.danger}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {currency} {formatAmount(totalExpense, currency)}
            </AppText>
          </View>
          <View style={styles.summaryItem}>
            <AppText variant="caption">Net flow</AppText>
            <AppText
              variant="label"
              color={net >= 0 ? colors.success : colors.danger}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {net >= 0 ? '+' : '-'} {currency}{' '}
              {formatAmount(Math.abs(net), currency)}
            </AppText>
          </View>
        </View>
      </Card>

      {totalIncome <= 0 && totalExpense <= 0 && !loading ? (
        <EmptyState
          icon="git-branch-outline"
          title="No river to show"
          message="Add income and expenses to see how money flows through your wallet."
        />
      ) : (
        <>
          <Card style={styles.riverCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderText}>
                <AppText variant="h3">Money river</AppText>
                <AppText variant="caption">
                  {monthLabel(anchor, false)} streams
                </AppText>
              </View>
              <View style={styles.headerIcon}>
                <Ionicons
                  name="water-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
            </View>

            <View
              style={styles.riverWrap}
              onLayout={(event) =>
                setChartWidth(event.nativeEvent.layout.width)
              }
            >
              <MoneyRiver
                income={incomeNodes}
                expense={expenseNodes}
                width={chartWidth}
                height={chartHeight}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </View>

            <View style={styles.riverLegend}>
              <View style={styles.legendSide}>
                <View
                  style={[styles.legendDot, { backgroundColor: colors.success }]}
                />
                <AppText variant="caption">Sources in</AppText>
              </View>
              <AppText variant="caption">Tap a stream</AppText>
              <View style={styles.legendSide}>
                <AppText variant="caption">Where it goes</AppText>
                <View
                  style={[styles.legendDot, { backgroundColor: colors.danger }]}
                />
              </View>
            </View>

            {selected ? (
              <View style={styles.selectedRow}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: selected.color },
                  ]}
                />
                <View style={styles.selectedText}>
                  <AppText variant="label" numberOfLines={1}>
                    {selected.name}
                  </AppText>
                  <AppText variant="caption">
                    {selected.side === 'income' ? 'Money in' : 'Money out'} ·{' '}
                    {selected.total > 0
                      ? Math.round((selected.value / selected.total) * 100)
                      : 0}
                    % of {selected.side === 'income' ? 'income' : 'spending'}
                  </AppText>
                </View>
                <AppText
                  variant="label"
                  color={
                    selected.side === 'income' ? colors.success : colors.danger
                  }
                >
                  {currency} {formatAmount(selected.value, currency)}
                </AppText>
                <Pressable
                  onPress={() => setSelectedId(null)}
                  hitSlop={10}
                  style={styles.clearButton}
                >
                  <Ionicons name="close" size={16} color={colors.textMuted} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.tapHint}>
                <Ionicons
                  name="finger-print-outline"
                  size={16}
                  color={colors.textMuted}
                />
                <AppText variant="caption">
                  Tap any dot or stream to inspect it.
                </AppText>
              </View>
            )}
          </Card>

          <FlowList
            title="Sources in"
            caption="Where your money came from"
            nodes={incomeNodes}
            total={totalIncome}
            currency={currency}
            color={colors.success}
            emptyLabel="No income recorded this month."
            onSelect={setSelectedId}
            selectedId={selectedId}
          />

          <FlowList
            title="Where it goes"
            caption="How your spending splits up"
            nodes={expenseNodes}
            total={totalExpense}
            currency={currency}
            color={colors.danger}
            emptyLabel="No spending recorded this month."
            onSelect={setSelectedId}
            selectedId={selectedId}
          />
        </>
      )}

      <Loader visible={loading && !data} message="Tracing your money river..." />
    </Screen>
  );
}

interface FlowListProps {
  title: string;
  caption: string;
  nodes: RiverNode[];
  total: number;
  currency: string;
  color: string;
  emptyLabel: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function FlowList({
  title,
  caption,
  nodes,
  total,
  currency,
  color,
  emptyLabel,
  selectedId,
  onSelect,
}: FlowListProps) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();

  return (
    <Card style={styles.listCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderText}>
          <AppText variant="h3">{title}</AppText>
          <AppText variant="caption">{caption}</AppText>
        </View>
        <AppText variant="label" color={color}>
          {currency} {formatAmount(total, currency)}
        </AppText>
      </View>

      {nodes.length === 0 ? (
        <AppText variant="caption">{emptyLabel}</AppText>
      ) : (
        <View style={styles.listRows}>
          {nodes.map((node) => {
            const percent =
              total > 0 ? Math.round((node.value / total) * 100) : 0;
            const active = selectedId === node.id;
            return (
              <Pressable
                key={node.id}
                onPress={() => onSelect(active ? null : node.id)}
                style={[
                  styles.listRow,
                  active ? { backgroundColor: colors.surfaceAlt } : null,
                ]}
              >
                <View
                  style={[styles.legendDot, { backgroundColor: node.color }]}
                />
                <View style={styles.listRowText}>
                  <View style={styles.listRowTop}>
                    <AppText
                      variant="label"
                      numberOfLines={1}
                      style={styles.listName}
                    >
                      {node.name}
                    </AppText>
                    <AppText variant="caption">{percent}%</AppText>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${percent}%`,
                          backgroundColor: node.color,
                        },
                      ]}
                    />
                  </View>
                </View>
                <AppText variant="label" numberOfLines={1}>
                  {formatAmount(node.value, currency)}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    summaryCard: { marginBottom: Spacing.lg },
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
    summaryRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    summaryItem: { flex: 1, gap: 2, minWidth: 0 },
    riverCard: { marginBottom: Spacing.lg },
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
    riverWrap: { marginHorizontal: -Spacing.sm },
    riverLegend: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: Spacing.sm,
    },
    legendSide: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: Radius.pill,
    },
    selectedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.md,
      padding: Spacing.sm,
      borderRadius: Radius.md,
      backgroundColor: colors.surfaceAlt,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    selectedText: { flex: 1, minWidth: 0 },
    clearButton: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tapHint: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      marginTop: Spacing.md,
    },
    listCard: { marginBottom: Spacing.lg },
    listRows: { gap: Spacing.xs },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      borderRadius: Radius.md,
    },
    listRowText: { flex: 1, minWidth: 0, gap: 4 },
    listRowTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    listName: { flex: 1 },
    progressTrack: {
      height: 5,
      borderRadius: Radius.pill,
      backgroundColor: colors.surfaceAlt,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: Radius.pill,
    },
  });

export default MoneyRiverScreen;
