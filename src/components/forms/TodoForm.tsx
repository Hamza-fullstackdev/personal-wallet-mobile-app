import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useAddTodo, useUpdateTodo } from '../../hooks/useTodoMutations';
import type { TodosStackParamList } from '../../navigation/types';
import { Spacing } from '../../theme';
import { toISODate } from '../../utils/format';
import { Banner, Button, Card, DateField, Input } from '../ui';

type Nav = NativeStackNavigationProp<TodosStackParamList, 'TodoForm'>;
type Route = RouteProp<TodosStackParamList, 'TodoForm'>;

export function TodoForm() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const todo = route.params?.todo;

  const [title, setTitle] = useState(todo?.title ?? '');
  const [description, setDescription] = useState(todo?.description ?? '');
  const [targetAmount, setTargetAmount] = useState(
    todo?.targetAmount ? String(todo.targetAmount) : '',
  );
  const [targetDate, setTargetDate] = useState<Date | null>(
    todo?.targetDate ? new Date(todo.targetDate) : null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const addTodoMutation = useAddTodo();
  const updateTodoMutation = useUpdateTodo();
  const saving = addTodoMutation.isPending || updateTodoMutation.isPending;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = 'Title is required.';
    if (targetAmount.trim()) {
      const numeric = Number(targetAmount);
      if (!Number.isFinite(numeric) || numeric < 0) next.targetAmount = 'Enter a valid amount.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      targetAmount: targetAmount.trim() ? Number(targetAmount) : 0,
      targetDate: targetDate ? toISODate(targetDate) : null,
    };

    try {
      if (todo) {
        await updateTodoMutation.mutateAsync({ todoId: todo._id, ...payload });
      } else {
        await addTodoMutation.mutateAsync(payload);
      }
      Alert.alert('Success', todo ? 'Todo updated.' : 'Todo added.', [
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
            label="Title"
            placeholder="Buy a car"
            value={title}
            onChangeText={setTitle}
            leftIcon="flag-outline"
            error={errors.title}
          />
          <Input
            label="Description"
            placeholder="Add details (optional)"
            value={description}
            onChangeText={setDescription}
            leftIcon="chatbox-ellipses-outline"
            multiline
          />
          <Input
            label="Target price"
            placeholder="0 (optional)"
            value={targetAmount}
            onChangeText={setTargetAmount}
            keyboardType="numeric"
            leftIcon="pricetag-outline"
            error={errors.targetAmount}
            hint="The amount you plan to spend on this goal."
          />
          <DateField
            label="Target date"
            value={targetDate}
            onChange={setTargetDate}
          />
        </View>
      </Card>

      <Button
        title={todo ? 'Update Todo' : 'Add Todo'}
        icon={todo ? 'save-outline' : 'add-circle-outline'}
        onPress={handleSubmit}
        loading={saving}
        disabled={saving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.lg },
  fields: { gap: Spacing.lg },
});

export default TodoForm;
