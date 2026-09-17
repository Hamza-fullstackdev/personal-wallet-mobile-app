import { SwitchBalanceForm } from '../../components/forms/SwitchBalanceForm';
import { Screen } from '../../components/ui';

export function SwitchBalanceScreen() {
  return (
    <Screen title="Switch Balance" subtitle="Move money between categories">
      <SwitchBalanceForm />
    </Screen>
  );
}

export default SwitchBalanceScreen;
