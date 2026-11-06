import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useAddLoan } from '../../hooks/useWalletMutations';
import { useCategories } from '../../hooks/useCategories';
import type { HomeStackParamList } from '../../navigation/types';
import { Spacing } from '../../theme';
import { formatAmount, toISODate } from '../../utils/format';
import { Banner, Button, Card, DateField, Input, Select, type SelectOption } from '../ui';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export function GiveLoanForm() {
  const navigation = useNavigation<Nav>();
  const { categories, loading } = useCategories();

  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState<Date | null>(new Date());
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const addLoanMutation = useAddLoan();

  const options: SelectOption[] = categories.map((category) => ({
    label: `${category.name} (${formatAmount(category.balance)})`,
    value: category._id,
    description: category.description,
  }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Recipient name is required.';
    if (!reason.trim()) next.reason = 'Reason is required.';
    const numeric = Number(amount);
    if (!amount.trim()) next.amount = 'Amount is required.';
    else if (!Number.isFinite(numeric) || numeric <= 0) next.amount = 'Enter a valid amount.';
    if (!categoryId) next.categoryId = 'Select the category to deduct from.';
    if (!date) next.date = 'Loan date is required.';
    if (!returnDate) next.returnDate = 'Expected return date is required.';
    else if (date && returnDate < date) next.returnDate = 'Return date must be after the loan date.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    try {
      await addLoanMutation.mutateAsync({
        name: name.trim(),
        reason: reason.trim(),
        balance: Number(amount),
        categoryId,
        date: toISODate(date as Date),
        return: toISODate(returnDate as Date),
      });
      Alert.alert('Success', 'Loan recorded successfully.', [
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
            label="Recipient name"
            placeholder="Who are you lending to?"
            value={name}
            onChangeText={setName}
            leftIcon="person-outline"
            error={errors.name}
          />
          <Input
            label="Reason"
            placeholder="Why is this loan given?"
            value={reason}
            onChangeText={setReason}
            leftIcon="chatbox-ellipses-outline"
            multiline
            error={errors.reason}
          />
          <Input
            label="Amount"
            placeholder="0"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            leftIcon="cash-outline"
            error={errors.amount}
          />
          <Select
            label="Deduct from category"
            placeholder={loading ? 'Loading categories...' : 'Choose a category'}
            options={options}
            value={categoryId}
            onChange={setCategoryId}
            icon="folder-open-outline"
            error={errors.categoryId}
            disabled={loading}
          />
          <DateField label="Loan date" value={date} onChange={setDate} error={errors.date} />
          <DateField
            label="Expected return date"
            value={returnDate}
            onChange={setReturnDate}
            error={errors.returnDate}
            minimumDate={date ?? undefined}
          />
        </View>
      </Card>

      <Button
        title="Give Loan"
        variant="danger"
        onPress={handleSubmit}
        loading={addLoanMutation.isPending}
        disabled={addLoanMutation.isPending || categories.length === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },
  fields: { gap: Spacing.lg },
});

export default GiveLoanForm;
