import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Colors, Radius, Spacing } from '../../theme';
import { formatAmount, formatDate } from '../../utils/format';
import type { Loan } from '../../types';
import { AppText, Badge } from '../ui';

interface UpcomingLoansCardProps {
  loans: Loan[];
  currency?: string;
  onViewAll?: () => void;
  onGiveLoan?: () => void;
}

function dueInfo(returnDate: string) {
  const due = new Date(returnDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (days < 0) {
    return {
      label: `Overdue ${Math.abs(days)}d`,
      color: Colors.danger,
      background: 'rgba(224,69,90,0.10)',
    };
  }
  if (days === 0) {
    return { label: 'Due today', color: Colors.danger, background: 'rgba(224,69,90,0.10)' };
  }
  if (days <= 7) {
    return {
      label: `Due in ${days}d`,
      color: Colors.primary,
      background: Colors.primarySoft,
    };
  }
  return {
    label: formatDate(returnDate),
    color: Colors.textSecondary,
    background: Colors.surfaceAlt,
  };
}

export function UpcomingLoansCard({
  loans,
  currency = 'PKR',
  onViewAll,
  onGiveLoan,
}: UpcomingLoansCardProps) {
  if (loans.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <AppText variant="h3">Loans to collect</AppText>
          <AppText variant="caption">Nearest expected returns first</AppText>
        </View>
        {onViewAll ? (
          <Pressable onPress={onViewAll} hitSlop={8} style={styles.viewAll}>
            <AppText variant="caption" color={Colors.primary} weight="semiBold">
              View all
            </AppText>
            <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.list}>
        {loans.map((loan) => {
          const due = dueInfo(loan.return);
          return (
            <View key={loan._id} style={styles.row}>
              <View style={styles.icon}>
                <Ionicons name="person-outline" size={18} color={Colors.primary} />
              </View>
              <View style={styles.info}>
                <AppText weight="medium" numberOfLines={1}>
                  {loan.name}
                </AppText>
                <AppText variant="caption" numberOfLines={1} style={styles.subtitle}>
                  {loan.reason}
                </AppText>
              </View>
              <View style={styles.right}>
                <AppText variant="amount" numberOfLines={1}>
                  {formatAmount(loan.balance, currency)}
                </AppText>
                <Badge
                  label={due.label}
                  color={due.color}
                  background={due.background}
                  style={styles.badge}
                />
              </View>
            </View>
          );
        })}
      </View>

      {onGiveLoan ? (
        <Pressable
          onPress={onGiveLoan}
          style={({ pressed }) => [styles.cta, pressed ? styles.pressed : null]}
        >
          <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
          <AppText variant="body" weight="medium" color={Colors.primary}>
            Give a new loan
          </AppText>
        </Pressable>
      ) : null}
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
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  subtitle: { marginTop: 2 },
  right: { alignItems: 'flex-end', marginLeft: Spacing.sm },
  badge: { marginTop: Spacing.xs },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryFaint,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  pressed: { opacity: 0.75 },
});

export default UpcomingLoansCard;
