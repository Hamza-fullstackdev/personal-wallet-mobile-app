import { BalanceEntryForm } from '../../components/forms/BalanceEntryForm';
import { Screen } from '../../components/ui';

export function AddIncomeScreen() {
  return (
    <Screen title="Add Income" subtitle="Increase a category balance">
      <BalanceEntryForm mode="incoming" />
    </Screen>
  );
}

export default AddIncomeScreen;
