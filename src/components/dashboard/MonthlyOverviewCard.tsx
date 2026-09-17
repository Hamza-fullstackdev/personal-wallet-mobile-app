import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '../../theme';
import { formatAmount } from '../../utils/format';
import type { StatementSummary } from '../../types';
import { AppText, Badge, Card } from '../ui';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface MonthlyOverviewCardProps {
  summary?: StatementSummary | null;
  currency?: string;
}

interface StatProps {
  icon: IoniconName;
  label: string;
  value: string;
  color: string;
}

function Stat({ icon, label, value, color }: StatProps) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <AppText variant="caption" numberOfLines={1}>
        {label}
      </AppText>
      <AppText variant="amount" color={color} numberOfLines={1} style={styles.statValue}>
        {value}
      </AppText>
    </View>
  );
}

export function MonthlyOverviewCard({ summary, currency = 'PKR' }: MonthlyOverviewCardProps) {
  const income = summary?.totalIncoming ?? 0;
  const expense = summary?.totalOutgoing ?? 0;
  const net = summary?.netCashFlow ?? 0;
  const loansGiven = summary?.totalLoanGiven ?? 0;
  const loansReturned = summary?.totalLoanReturned ?? 0;
  const count = summary?.transactionCount ?? 0;

  const total = income + expense;
  const incomeShare = total > 0 ? (income / total) * 100 : 0;
  const expenseShare = total > 0 ? (expense / total) * 100 : 0;

  const monthLabel = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const surplus = net >= 0;

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <AppText variant="label">This month</AppText>
          <AppText variant="h3">{monthLabel}</AppText>
        </View>
        <Badge
          label={surplus ? 'Surplus' : 'Deficit'}
          color={surplus ? Colors.success : Colors.danger}
          background={surplus ? 'rgba(78,120,247,0.12)' : 'rgba(224,69,90,0.10)'}
        />
      </View>

      <View style={styles.statsRow}>
        <Stat
          icon="arrow-down-circle"
          label="Income"
          value={formatAmount(income, currency)}
          color={Colors.success}
        />
        <View style={styles.statDivider} />
        <Stat
          icon="arrow-up-circle"
          label="Expense"
          value={formatAmount(expense, currency)}
          color={Colors.danger}
        />
        <View style={styles.statDivider} />
        <Stat
          icon={surplus ? 'trending-up' : 'trending-down'}
          label="Net flow"
          value={formatAmount(net, currency)}
          color={surplus ? Colors.primary : Colors.danger}
        />
      </View>

      <View style={styles.track}>
        {total > 0 ? (
          <>
            <View style={[styles.incomeBar, { width: `${incomeShare}%` }]} />
            <View style={[styles.expenseBar, { width: `${expenseShare}%` }]} />
          </>
        ) : (
          <View style={styles.emptyBar} />
        )}
      </View>

      <View style={styles.footerRow}>
        <View style={styles.footerItem}>
          <AppText variant="caption">{count} transactions</AppText>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="hand-left-outline" size={13} color={Colors.textMuted} />
          <AppText variant="caption" style={styles.footerLabel}>
            {formatAmount(loansGiven, currency)} given
          </AppText>
        </View>
        <View style={styles.footerItem}>
          <Ionicons name="checkmark-done-outline" size={13} color={Colors.textMuted} />
          <AppText variant="caption" style={styles.footerLabel}>
            {formatAmount(loansReturned, currency)} back
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.lg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: { flex: 1, marginRight: Spacing.md },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: { flex: 1, gap: 2 },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: { marginTop: 1 },
  statDivider: {
    width: 1,
    height: 44,
    backgroundColor: Colors.divider,
    marginHorizontal: Spacing.md,
  },
  track: {
    flexDirection: 'row',
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryFaint,
    overflow: 'hidden',
  },
  incomeBar: { height: '100%', backgroundColor: Colors.success },
  expenseBar: { height: '100%', backgroundColor: Colors.danger },
  emptyBar: { flex: 1, backgroundColor: Colors.divider },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center' },
  footerLabel: { marginLeft: Spacing.xs },
});

export default MonthlyOverviewCard;
