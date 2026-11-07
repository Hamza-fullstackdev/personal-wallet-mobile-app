import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  Input,
  Loader,
  Pagination,
  Screen,
  Select,
  type SelectOption,
} from '../../components/ui';
import { useReceipt } from '../../components/receipt/ReceiptProvider';
import { useCategories } from '../../hooks/useCategories';
import { useCompleteTodo, useDeleteTodo } from '../../hooks/useTodoMutations';
import { useTodos } from '../../hooks/useTodos';
import type { TodosStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { Radius, Spacing, type ThemeColors } from '../../theme';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { pickCategoryOptions } from '../../utils/categoryOptions';
import { formatAmount, formatDate } from '../../utils/format';
import { receiptFromTodo } from '../../utils/receipt';
import type { Todo } from '../../types';

const LIMIT = 12;

const STATUS_OPTIONS: SelectOption[] = [
  { label: 'All todos', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
];

type Nav = NativeStackNavigationProp<TodosStackParamList, 'Todos'>;

export function TodosScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const currency = useAuthStore((state) => state.user?.currency ?? 'PKR');
  const { categories } = useCategories();
  const { openReceipt } = useReceipt();

  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const [completeTarget, setCompleteTarget] = useState<Todo | null>(null);
  const [completeAmount, setCompleteAmount] = useState('');
  const [completeCategoryId, setCompleteCategoryId] = useState('');
  const [completeError, setCompleteError] = useState<string | null>(null);

  const completeTodoMutation = useCompleteTodo();
  const deleteTodoMutation = useDeleteTodo();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const filters = useMemo(
    () => ({
      page,
      limit: LIMIT,
      status,
      search: debouncedSearch || undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc' as const,
    }),
    [page, status, debouncedSearch],
  );

  const { todos, meta, loading, refreshing, error, refetch } = useTodos(filters);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const categoryOptions = useMemo(() => pickCategoryOptions(categories), [categories]);

  const hasFilters = Boolean(search) || status !== 'all';

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
  };

  const openComplete = (todo: Todo) => {
    setCompleteTarget(todo);
    setCompleteAmount(
      todo.targetAmount && todo.targetAmount > 0 ? String(todo.targetAmount) : '',
    );
    setCompleteCategoryId('');
    setCompleteError(null);
  };

  const closeComplete = () => {
    setCompleteTarget(null);
    setCompleteAmount('');
    setCompleteCategoryId('');
    setCompleteError(null);
  };

  const confirmComplete = async () => {
    if (!completeTarget) return;
    const numeric = Number(completeAmount);
    if (!completeAmount.trim() || !Number.isFinite(numeric) || numeric <= 0) {
      setCompleteError('Enter a valid amount.');
      return;
    }
    if (!completeCategoryId) return;

    try {
      await completeTodoMutation.mutateAsync({
        todoId: completeTarget._id,
        amount: numeric,
        categoryId: completeCategoryId,
      });
      closeComplete();
      Alert.alert('Success', 'Todo completed and recorded as an investment.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to complete the todo.');
    }
  };

  const removeTodo = async (todoId: string) => {
    try {
      await deleteTodoMutation.mutateAsync(todoId);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to delete the todo.');
    }
  };

  const confirmDelete = (todo: Todo) => {
    Alert.alert('Delete todo', `Delete "${todo.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void removeTodo(todo._id) },
    ]);
  };

  const showingFrom = meta && meta.totalItems > 0 ? (meta.currentPage - 1) * meta.perPage + 1 : 0;
  const showingTo = meta ? Math.min(meta.currentPage * meta.perPage, meta.totalItems) : 0;

  return (
    <Screen
      title="Future Todos"
      icon="flag-outline"
      right={
        <View style={styles.headerButtons}>
          <Pressable
            onPress={() => setShowFilters((value) => !value)}
            style={[styles.headerButton, hasFilters ? styles.headerButtonActive : null]}
            hitSlop={8}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={hasFilters ? colors.onPrimary : colors.primaryDeep}
            />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('TodoForm')}
            style={styles.addButton}
            hitSlop={8}
          >
            <Ionicons name="add" size={22} color={colors.onPrimary} />
          </Pressable>
        </View>
      }
      refreshing={refreshing}
      onRefresh={refetch}
    >
      {showFilters ? (
        <Card style={styles.filtersCard}>
          <View style={styles.fields}>
            <Input
              label="Search"
              placeholder="Search by title or description"
              value={search}
              onChangeText={setSearch}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={status}
              onChange={setStatus}
              sheetTitle="Todo status"
            />
          </View>

          {hasFilters ? (
            <Button
              title="Reset filters"
              variant="ghost"
              size="sm"
              icon="refresh"
              onPress={resetFilters}
              style={styles.reset}
            />
          ) : null}
        </Card>
      ) : null}

      {error ? <Banner message={error} type="error" /> : null}

      {meta && meta.totalItems > 0 ? (
        <AppText variant="caption" style={styles.summary}>
          Showing {showingFrom}–{showingTo} of {meta.totalItems} todos
        </AppText>
      ) : null}

      {!loading && todos.length === 0 ? (
        <EmptyState
          icon="flag-outline"
          title="No todos found"
          message={
            hasFilters
              ? 'Try adjusting your filters.'
              : 'Add future goals like “Buy a car” or “Buy a mobile”.'
          }
        >
          {!hasFilters ? (
            <Button
              title="Add Todo"
              icon="add"
              size="sm"
              fullWidth={false}
              onPress={() => navigation.navigate('TodoForm')}
              style={styles.emptyButton}
            />
          ) : null}
        </EmptyState>
      ) : null}

      <View style={styles.list}>
        {todos.map((todo) => {
          const completed = todo.status === 'completed';
          return (
            <Card key={todo._id} style={styles.todoCard}>
              <View style={styles.todoHeader}>
                <View style={styles.todoTitleWrap}>
                  <AppText variant="h3" numberOfLines={2}>
                    {todo.title}
                  </AppText>
                  {todo.description ? (
                    <AppText variant="caption" numberOfLines={2} style={styles.todoDescription}>
                      {todo.description}
                    </AppText>
                  ) : null}
                </View>
                <Badge
                  label={completed ? 'Completed' : 'Pending'}
                  color={completed ? colors.success : colors.danger}
                  background={completed ? colors.successSoft : colors.dangerSoft}
                />
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <AppText variant="caption">Target price</AppText>
                  <AppText variant="label">
                    {todo.targetAmount
                      ? `${currency} ${formatAmount(todo.targetAmount, currency)}`
                      : '—'}
                  </AppText>
                </View>
                <View style={styles.metaItem}>
                  <AppText variant="caption">Target date</AppText>
                  <AppText variant="label">{formatDate(todo.targetDate)}</AppText>
                </View>
              </View>

              {completed ? (
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <AppText variant="caption">Invested</AppText>
                    <AppText variant="label" color={colors.primaryDeep}>
                      {currency} {formatAmount(todo.spentAmount, currency)}
                    </AppText>
                  </View>
                  <View style={styles.metaItem}>
                    <AppText variant="caption">Completed on</AppText>
                    <AppText variant="label">{formatDate(todo.completedAt)}</AppText>
                  </View>
                </View>
              ) : null}

              {!completed ? (
                <Button
                  title="Mark as Done"
                  variant="success"
                  size="sm"
                  icon="checkmark-circle-outline"
                  onPress={() => openComplete(todo)}
                  style={styles.doneButton}
                />
              ) : null}

              <View style={styles.secondaryActions}>
                {!completed ? (
                  <Button
                    title="Edit"
                    variant="soft"
                    size="sm"
                    icon="create-outline"
                    fullWidth={false}
                    onPress={() => navigation.navigate('TodoForm', { todo })}
                    style={styles.actionButton}
                  />
                ) : (
                  <Button
                    title="Receipt"
                    variant="soft"
                    size="sm"
                    icon="receipt-outline"
                    fullWidth={false}
                    onPress={() => openReceipt(receiptFromTodo(todo))}
                    style={styles.actionButton}
                  />
                )}
                <Button
                  title="Delete"
                  variant="danger"
                  size="sm"
                  icon="trash-outline"
                  fullWidth={false}
                  onPress={() => confirmDelete(todo)}
                  style={styles.actionButton}
                />
              </View>
            </Card>
          );
        })}
      </View>

      {meta ? (
        <Pagination page={meta.currentPage} totalPages={meta.totalPages} onChange={setPage} />
      ) : null}

      <Loader visible={loading && todos.length === 0} message="Loading todos..." />

      <Modal
        visible={Boolean(completeTarget)}
        transparent
        animationType="slide"
        onRequestClose={closeComplete}
      >
        <Pressable style={styles.backdrop} onPress={closeComplete} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <AppText variant="h3">Complete todo</AppText>
            <Pressable onPress={closeComplete} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {completeTarget ? (
            <View style={styles.sheetBody}>
              <AppText variant="label" numberOfLines={2}>
                {completeTarget.title}
              </AppText>
              {completeTarget.targetAmount ? (
                <AppText variant="caption">
                  Target: {currency} {formatAmount(completeTarget.targetAmount, currency)}
                </AppText>
              ) : null}
              <AppText variant="caption" style={styles.sheetHint}>
                Enter the amount you actually spent. It is deducted from the selected category and
                recorded in History as an investment.
              </AppText>

              <Input
                label="Amount spent"
                placeholder="0"
                value={completeAmount}
                onChangeText={(value) => {
                  setCompleteAmount(value);
                  setCompleteError(null);
                }}
                keyboardType="numeric"
                leftIcon="cash-outline"
                error={completeError ?? undefined}
              />

              <Select
                label="Paid from category"
                placeholder={categoryOptions.length ? 'Choose a category' : 'No categories available'}
                options={categoryOptions}
                value={completeCategoryId}
                onChange={setCompleteCategoryId}
                icon="folder-open-outline"
                disabled={categoryOptions.length === 0}
              />

              <Button
                title="Confirm & Mark Done"
                variant="success"
                icon="checkmark-done"
                onPress={confirmComplete}
                loading={completeTodoMutation.isPending}
                disabled={completeTodoMutation.isPending || !completeCategoryId}
                style={styles.sheetButton}
              />
            </View>
          ) : null}
        </View>
      </Modal>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    headerButtons: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerButtonActive: { backgroundColor: colors.primary },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filtersCard: { marginBottom: Spacing.lg },
    fields: { gap: Spacing.lg },
    reset: { marginTop: Spacing.md, alignSelf: 'flex-start' },
    summary: { marginBottom: Spacing.md },
    list: { gap: Spacing.md },
    todoCard: { padding: Spacing.lg },
    todoHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
    todoTitleWrap: { flex: 1 },
    todoDescription: { marginTop: 2 },
    metaRow: {
      flexDirection: 'row',
      gap: Spacing.xl,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    metaItem: { flex: 1, gap: 2 },
    doneButton: { marginTop: Spacing.lg },
    secondaryActions: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.md,
    },
    actionButton: { flex: 1 },
    emptyButton: { marginTop: Spacing.lg, paddingHorizontal: Spacing.xl },
    backdrop: { flex: 1, backgroundColor: colors.backdrop },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      padding: Spacing.xl,
      paddingBottom: Spacing.xxxl,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    sheetBody: { gap: Spacing.md },
    sheetHint: { marginBottom: Spacing.sm },
    sheetButton: { marginTop: Spacing.md },
  });

export default TodosScreen;
