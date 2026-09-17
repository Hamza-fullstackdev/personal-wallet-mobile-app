import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useAddIncoming, useAddOutgoing } from '../../hooks/useWalletMutations';
import { useCategories } from '../../hooks/useCategories';
import type { HomeStackParamList } from '../../navigation/types';
import { Spacing } from '../../theme';
import { formatAmount } from '../../utils/format';
import { AppText, Banner, Button, Card, Input, Select, type SelectOption } from '../ui';

type Mode = 'incoming' | 'outgoing';
type Nav = NativeStackNavigationProp<HomeStackParamList>;

interface BalanceEntryFormProps {
  mode: Mode;
}

const COPY: Record<Mode, { amountLabel: string; descriptionLabel: string; success: string; button: string }> = {
  incoming: {
    amountLabel: 'Amount to add',
    descriptionLabel: 'Description',
    success: 'Income added successfully.',
    button: 'Add Income',
  },
  outgoing: {
    amountLabel: 'Amount to deduct',
    descriptionLabel: 'Description',
    success: 'Expense recorded successfully.',
    button: 'Add Expense',
  },
};

export function BalanceEntryForm({ mode }: BalanceEntryFormProps) {
  const navigation = useNavigation<Nav>();
  const { categories, loading: categoriesLoading } = useCategories();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const incomingMutation = useAddIncoming();
  const outgoingMutation = useAddOutgoing();
  const mutation = mode === 'incoming' ? incomingMutation : outgoingMutation;

  const copy = COPY[mode];

  const options: SelectOption[] = categories.map((category) => ({
    label: `${category.name} (${formatAmount(category.balance)})`,
    value: category._id,
    description: category.description,
  }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!description.trim()) next.description = 'Description is required.';
    if (!categoryId) next.categoryId = 'Please choose a category.';
    const numeric = Number(amount);
    if (!amount.trim()) next.amount = 'Amount is required.';
    else if (!Number.isFinite(numeric) || numeric <= 0) next.amount = 'Enter a valid amount.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    try {
      const payload = {
        balance: Number(amount),
        categoryId,
        description: description.trim(),
      };
      await mutation.mutateAsync(payload);

      Alert.alert('Success', copy.success, [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Something went wrong.');
    }
  };

  return (
    <View style={styles.container}>
      {formError ? <Banner message={formError} type="error" style={styles.banner} /> : null}

      <Card>
        <View style={styles.fields}>
          <Input
            label="Description"
            placeholder="e.g. Salary, Groceries"
            value={description}
            onChangeText={setDescription}
            leftIcon="create-outline"
            error={errors.description}
          />

          <Input
            label={copy.amountLabel}
            placeholder="0"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            leftIcon="cash-outline"
            error={errors.amount}
          />

          <Select
            label="Category"
            placeholder={categoriesLoading ? 'Loading categories...' : 'Choose a category'}
            options={options}
            value={categoryId}
            onChange={setCategoryId}
            icon="folder-open-outline"
            error={errors.categoryId}
            disabled={categoriesLoading}
          />
        </View>
      </Card>

      {categories.length === 0 && !categoriesLoading ? (
        <AppText variant="caption" center style={styles.hint}>
          You have no categories yet. Add a category first to start tracking money.
        </AppText>
      ) : null}

      <Button
        title={copy.button}
        onPress={handleSubmit}
        loading={mutation.isPending}
        disabled={mutation.isPending || categories.length === 0}
        style={styles.submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },
  banner: { marginBottom: 0 },
  fields: { gap: Spacing.lg },
  hint: { paddingHorizontal: Spacing.lg },
  submit: { marginTop: Spacing.sm },
});

export default BalanceEntryForm;
