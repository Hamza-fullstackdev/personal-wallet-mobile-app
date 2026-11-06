import { BalanceEntryForm } from '../../components/forms/BalanceEntryForm';
import { Screen } from '../../components/ui';

export function AddExpenseScreen() {
  return (
    <Screen title="Add Expense">
      <BalanceEntryForm mode="outgoing" />
    </Screen>
  );
}

export default AddExpenseScreen;
