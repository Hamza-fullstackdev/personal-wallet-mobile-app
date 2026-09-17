import { BalanceEntryForm } from '../../components/forms/BalanceEntryForm';
import { Screen } from '../../components/ui';

export function AddExpenseScreen() {
  return (
    <Screen title="Add Expense" subtitle="Deduct from a category balance">
      <BalanceEntryForm mode="outgoing" />
    </Screen>
  );
}

export default AddExpenseScreen;
