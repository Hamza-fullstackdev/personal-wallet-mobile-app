import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useSwitchBalance } from '../../hooks/useWalletMutations';
import { useCategories } from '../../hooks/useCategories';
import type { HomeStackParamList } from '../../navigation/types';
import { Spacing } from '../../theme';
import { formatAmount } from '../../utils/format';
import { Banner, Button, Card, Input, Select, type SelectOption } from '../ui';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export function SwitchBalanceForm() {
  const navigation = useNavigation<Nav>();
  const { categories, loading } = useCategories();

  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const switchBalanceMutation = useSwitchBalance();

  const options: SelectOption[] = categories.map((category) => ({
    label: `${category.name} (${formatAmount(category.balance)})`,
    value: category._id,
    description: category.description,
  }));

  const validate = () => {
    const next: Record<string, string> = {};
    const numeric = Number(amount);
    if (!amount.trim()) next.amount = 'Amount is required.';
    else if (!Number.isFinite(numeric) || numeric <= 0) next.amount = 'Enter a valid amount.';
    if (!from) next.from = 'Select the source category.';
    if (!to) next.to = 'Select the destination category.';
    if (from && to && from === to) next.to = 'Source and destination must differ.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    try {
      await switchBalanceMutation.mutateAsync({ from, to, balance: Number(amount) });
      Alert.alert('Success', 'Balance switched successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Something went wrong.');
    }
  };

  return (
    <View style={styles.container}>
      {formError ? <Banner message={formError} type="error" /> : null}

      <Card>
        <View style={styles.fields}>
          <Input
            label="Amount to move"
            placeholder="0"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            leftIcon="swap-horizontal-outline"
            error={errors.amount}
          />
          <Select
            label="From category"
            placeholder={loading ? 'Loading categories...' : 'Select source'}
            options={options}
            value={from}
            onChange={setFrom}
            icon="arrow-up-circle-outline"
            error={errors.from}
            disabled={loading}
          />
          <Select
            label="To category"
            placeholder={loading ? 'Loading categories...' : 'Select destination'}
            options={options}
            value={to}
            onChange={setTo}
            icon="arrow-down-circle-outline"
            error={errors.to}
            disabled={loading}
          />
        </View>
      </Card>

      {categories.length < 2 && !loading ? (
        <Banner
          type="info"
          message="You need at least two categories to move balance between them."
        />
      ) : null}

      <Button
        title="Switch Balance"
        onPress={handleSubmit}
        loading={switchBalanceMutation.isPending}
        disabled={switchBalanceMutation.isPending || categories.length < 2}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },
  fields: { gap: Spacing.lg },
});

export default SwitchBalanceForm;
