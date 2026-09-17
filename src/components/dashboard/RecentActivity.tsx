import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '../../theme';
import { formatAmount } from '../../utils/format';
import { TONE_COLORS, transactionMeta } from '../../utils/transactionMeta';
import type { StatementTransaction } from '../../types';
import { AppText, EmptyState } from '../ui';

interface RecentActivityProps {
  transactions: StatementTransaction[];
  currency?: string;
  onViewAll?: () => void;
}

function amountInfo(t: StatementTransaction, currency: string) {
  if (t.credit > 0) {
    return { text: `+ ${formatAmount(t.credit, currency)}`, color: Colors.success };
  }
  if (t.debit > 0) {
    return { text: `- ${formatAmount(t.debit, currency)}`, color: Colors.danger };
  }
  return { text: formatAmount(t.amount, currency), color: Colors.textSecondary };
}

export function RecentActivity({ transactions, currency = 'PKR', onViewAll }: RecentActivityProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText variant="h3">Recent activity</AppText>
        {onViewAll ? (
          <Pressable onPress={onViewAll} hitSlop={8} style={styles.viewAll}>
            <AppText variant="caption" color={Colors.primary} weight="semiBold">
              View all
            </AppText>
            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
          </Pressable>
        ) : null}
      </View>

      {transactions.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No activity yet"
          message="Transactions you make this month will appear here."
        />
      ) : (
        <View style={styles.list}>
          {transactions.map((item) => {
            const meta = transactionMeta(item.type);
            const tone = TONE_COLORS[meta.tone];
            const amount = amountInfo(item, currency);
            return (
              <View key={item.id} style={styles.row}>
                <View style={[styles.icon, { backgroundColor: tone.bg }]}>
                  <Ionicons name={meta.icon} size={18} color={tone.fg} />
                </View>
                <View style={styles.info}>
                  <AppText weight="medium" numberOfLines={1}>
                    {item.title}
                  </AppText>
                  <AppText variant="caption" numberOfLines={1} style={styles.subtitle}>
                    {item.category} · {item.date}
                  </AppText>
                </View>
                <View style={styles.amount}>
                  <AppText variant="amount" color={amount.color} numberOfLines={1}>
                    {amount.text}
                  </AppText>
                  <AppText variant="caption" numberOfLines={1}>
                    {meta.label}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  list: { gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  subtitle: { marginTop: 2 },
  amount: { alignItems: 'flex-end', marginLeft: Spacing.sm },
});

export default RecentActivity;
