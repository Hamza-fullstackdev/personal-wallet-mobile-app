import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useAddCategory } from '../../hooks/useWalletMutations';
import type { HomeStackParamList } from '../../navigation/types';
import { Spacing } from '../../theme';
import { Banner, Button, Card, Input } from '../ui';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export function CategoryForm() {
  const navigation = useNavigation<Nav>();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [balance, setBalance] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const addCategoryMutation = useAddCategory();

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Category name is required.';
    if (!description.trim()) next.description = 'Description is required.';
    const numeric = Number(balance);
    if (!balance.trim()) next.balance = 'Opening balance is required.';
    else if (!Number.isFinite(numeric)) next.balance = 'Enter a valid number.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    try {
      await addCategoryMutation.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        balance: Number(balance),
      });
      Alert.alert('Success', 'Category created successfully.', [
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
            label="Category name"
            placeholder="e.g. Savings, Cash, Bank"
            value={name}
            onChangeText={setName}
            leftIcon="pricetag-outline"
            error={errors.name}
          />
          <Input
            label="Description"
            placeholder="Short description"
            value={description}
            onChangeText={setDescription}
            leftIcon="document-text-outline"
            error={errors.description}
          />
          <Input
            label="Opening balance"
            placeholder="0"
            value={balance}
            onChangeText={setBalance}
            keyboardType="numeric"
            leftIcon="wallet-outline"
            error={errors.balance}
          />
        </View>
      </Card>

      <Button
        title="Create Category"
        onPress={handleSubmit}
        loading={addCategoryMutation.isPending}
        disabled={addCategoryMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },
  fields: { gap: Spacing.lg },
});

export default CategoryForm;
