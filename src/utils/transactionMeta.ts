import type { Ionicons } from '@expo/vector-icons';

import type { ThemeColors } from '../theme';

export type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
export type TransactionTone = 'in' | 'out' | 'neutral';

interface TransactionMeta {
  label: string;
  icon: IoniconName;
  tone: TransactionTone;
}

const META: Record<string, TransactionMeta> = {
  incoming: { label: 'Income', icon: 'arrow-down-circle', tone: 'in' },
  outgoing: { label: 'Expense', icon: 'arrow-up-circle', tone: 'out' },
  loan: { label: 'Loan Given', icon: 'hand-left', tone: 'out' },
  return: { label: 'Loan Returned', icon: 'checkmark-done-circle', tone: 'in' },
  switch: { label: 'Transfer', icon: 'swap-horizontal', tone: 'neutral' },
  investment: { label: 'Investment', icon: 'trending-up', tone: 'out' },
  other: { label: 'Transaction', icon: 'pricetag', tone: 'neutral' },
};

export function transactionMeta(type?: string | null): TransactionMeta {
  return META[type ?? 'other'] ?? META.other;
}

/** Green for money in, red for money out, brand-neutral for transfers. */
export function toneColors(colors: ThemeColors): Record<TransactionTone, { fg: string; bg: string }> {
  return {
    in: { fg: colors.success, bg: colors.successSoft },
    out: { fg: colors.danger, bg: colors.dangerSoft },
    neutral: { fg: colors.primary, bg: colors.primarySoft },
  };
}
