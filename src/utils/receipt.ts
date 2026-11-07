import type {
  Expense,
  Notification,
  Loan,
  ReceiptData,
  ReceiptDirection,
  StatementTransaction,
  Todo,
} from '../types';
import { transactionMeta } from './transactionMeta';

function cleanAmount(value: string): number {
  return parseFloat(value.replace(/,/g, '')) || 0;
}

function makeReference(id: string): string {
  return `RCPT-${id.slice(-8).toUpperCase()}`;
}

function directionFromTone(tone: 'in' | 'out' | 'neutral'): ReceiptDirection {
  if (tone === 'in') return 'in';
  if (tone === 'out') return 'out';
  return 'neutral';
}

function receiptTitle(type: string, title: string, description?: string): string {
  const value = title.trim();
  switch (type) {
    case 'incoming':
      return 'Income added';
    case 'outgoing':
      return description?.trim() || 'Expense';
    case 'loan': {
      const recipient = value.match(/^Loan to\s+(.+)$/i)?.[1]?.trim();
      return recipient || 'Loan given';
    }
    case 'return':
      return 'Loan returned';
    case 'switch':
      return 'Balance transferred';
    case 'investment':
      return (
        value.match(/invested in\s*(.*)/i)?.[1]?.trim() ||
        value ||
        'Investment'
      );
    default:
      return value || 'Transaction';
  }
}

export function receiptFromNotification(notification: Notification): ReceiptData {
  const title = notification.title ?? '';
  const message = notification.message ?? '';
  const meta = transactionMeta(notification.type);

  const amountMatch =
    title.match(/Rs\s*([\d,.]+)/i) ?? message.match(/Rs\s*([\d,.]+)/i);
  const description =
    notification.type === 'investment' || notification.type === 'outgoing'
      ? undefined
      : message.trim() || undefined;

  return {
    id: notification._id,
    type: notification.type,
    typeLabel: meta.label,
    direction: directionFromTone(meta.tone),
    amount: amountMatch ? cleanAmount(amountMatch[1]) : 0,
    title: receiptTitle(notification.type, title, message),
    description,
    descriptionLabel:
      notification.type === 'loan'
        ? 'Reason'
        : notification.type === 'investment'
          ? undefined
          : 'Message',
    date: notification.createdAt ?? new Date().toISOString(),
    reference: makeReference(notification._id),
  };
}

export function receiptFromStatementTransaction(transaction: StatementTransaction): ReceiptData {
  const direction: ReceiptDirection =
    transaction.credit > 0 ? 'in' : transaction.debit > 0 ? 'out' : 'neutral';
  const amount =
    transaction.credit > 0
      ? transaction.credit
      : transaction.debit > 0
        ? transaction.debit
        : transaction.amount;

  return {
    id: transaction.id,
    type: transaction.type,
    typeLabel: transactionMeta(transaction.type).label,
    direction,
    amount,
    title: receiptTitle(transaction.type, transaction.title, transaction.description),
    description:
      transaction.type === 'outgoing'
        ? undefined
        : transaction.description || undefined,
    descriptionLabel:
      transaction.type === 'loan'
        ? 'Reason'
        : transaction.type === 'incoming' ||
            transaction.type === 'outgoing' ||
            transaction.type === 'return'
          ? 'Message'
          : 'Details',
    date: transaction.rawDate || transaction.date,
    reference: makeReference(transaction.id),
    runningBalance: transaction.runningBalance,
  };
}

export function receiptFromLoan(loan: Loan): ReceiptData {
  return {
    id: loan._id,
    type: 'loan',
    typeLabel: 'Loan given',
    direction: 'out',
    amount: loan.balance,
    title: loan.name,
    description: loan.reason,
    descriptionLabel: 'Reason',
    date: loan.date || loan.createdAt || new Date().toISOString(),
    reference: makeReference(loan._id),
  };
}

export function receiptFromExpense(expense: Expense): ReceiptData {
  const meta = transactionMeta(expense.type);
  return {
    id: expense.id,
    type: expense.type,
    typeLabel: meta.label,
    direction: expense.type === 'incoming' ? 'in' : 'out',
    amount: expense.amount,
    title: receiptTitle(expense.type, expense.title, expense.description),
    description:
      expense.type === 'outgoing'
        ? undefined
        : expense.description || undefined,
    descriptionLabel: expense.type === 'investment' ? 'Details' : 'Message',
    date: expense.date,
    reference: makeReference(expense.id),
  };
}

export function receiptFromTodo(todo: Todo): ReceiptData {
  return {
    id: todo._id,
    type: 'investment',
    typeLabel: 'Investment',
    direction: 'out',
    amount: todo.spentAmount ?? 0,
    title: todo.title,
    description: todo.description || undefined,
    descriptionLabel: 'Details',
    date: todo.completedAt ?? todo.updatedAt ?? new Date().toISOString(),
    reference: makeReference(todo._id),
  };
}
