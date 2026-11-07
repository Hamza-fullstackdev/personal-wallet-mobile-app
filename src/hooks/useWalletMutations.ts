import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  addCategory,
  addIncoming,
  addLoan,
  addOutgoing,
  returnLoan,
  switchBalance,
  updateUser,
  type AddCategoryPayload,
  type AddLoanPayload,
  type BalanceEntryPayload,
  type ReturnLoanPayload,
  type SwitchBalancePayload,
  type UpdateUserPayload,
} from '../lib/api/wallet';
import { downloadStatementPdf, type StatementQuery } from '../lib/api/statement';
import { queryKeys } from '../lib/queryKeys';

/**
 * Wallet mutations. Every money-moving action invalidates the category summary
 * (balances), the loan lists, the notification history and the bank statement
 * (which is built from those notifications) so all screens stay in sync
 * without manual refetching.
 */
function useInvalidateWallet() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    void queryClient.invalidateQueries({ queryKey: queryKeys.loans.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.statement.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
  };
}

export function useAddCategory() {
  const invalidate = useInvalidateWallet();
  return useMutation({
    mutationFn: (payload: AddCategoryPayload) => addCategory(payload),
    onSuccess: invalidate,
  });
}

export function useSwitchBalance() {
  const invalidate = useInvalidateWallet();
  return useMutation({
    mutationFn: (payload: SwitchBalancePayload) => switchBalance(payload),
    onSuccess: invalidate,
  });
}

export function useAddIncoming() {
  const invalidate = useInvalidateWallet();
  return useMutation({
    mutationFn: (payload: BalanceEntryPayload) => addIncoming(payload),
    onSuccess: invalidate,
  });
}

export function useAddOutgoing() {
  const invalidate = useInvalidateWallet();
  return useMutation({
    mutationFn: (payload: BalanceEntryPayload) => addOutgoing(payload),
    onSuccess: invalidate,
  });
}

export function useAddLoan() {
  const invalidate = useInvalidateWallet();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddLoanPayload) => addLoan(payload),
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: queryKeys.loanPeople });
    },
  });
}

export function useReturnLoan() {
  const invalidate = useInvalidateWallet();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReturnLoanPayload) => returnLoan(payload),
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: queryKeys.loanPeople });
    },
  });
}

export function useUpdateUser() {
  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => updateUser(payload),
  });
}

export function useDownloadStatementPdf() {
  return useMutation({
    mutationFn: (query: StatementQuery) => downloadStatementPdf(query),
  });
}
