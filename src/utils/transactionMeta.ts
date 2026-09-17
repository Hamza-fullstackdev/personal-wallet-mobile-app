import type { Ionicons } from '@expo/vector-icons';

import { Colors } from '../theme';

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
  other: { label: 'Transaction', icon: 'pricetag', tone: 'neutral' },
};

export function transactionMeta(type?: string | null): TransactionMeta {
  return META[type ?? 'other'] ?? META.other;
}

export const TONE_COLORS: Record<TransactionTone, { fg: string; bg: string }> = {
  in: { fg: Colors.success, bg: 'rgba(78,120,247,0.12)' },
  out: { fg: Colors.danger, bg: 'rgba(224,69,90,0.10)' },
  neutral: { fg: Colors.primary, bg: Colors.primarySoft },
};
