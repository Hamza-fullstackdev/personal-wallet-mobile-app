import { GiveLoanForm } from '../../components/forms/GiveLoanForm';
import { Screen } from '../../components/ui';

export function GiveLoanScreen() {
  return (
    <Screen title="Give Loan" subtitle="Lend money from a category">
      <GiveLoanForm />
    </Screen>
  );
}

export default GiveLoanScreen;
