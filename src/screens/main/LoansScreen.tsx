import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Badge,
  Banner,
  Button,
  Card,
  DateField,
  EmptyState,
  Input,
  Loader,
  Pagination,
  Screen,
  Select,
  type SelectOption,
} from '../../components/ui';
import { pickCategoryOptions } from '../../utils/categoryOptions';
import { useLoans } from '../../hooks/useLoans';
import { useReturnLoan } from '../../hooks/useWalletMutations';
import { useCategories } from '../../hooks/useCategories';
import { useAuthStore } from '../../store/authStore';
import { Radius, Spacing, type ThemeColors } from '../../theme';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { formatAmount, formatDate, toISODate } from '../../utils/format';
import type { Loan } from '../../types';

const LIMIT = 9;

const STATUS_OPTIONS: SelectOption[] = [
  { label: 'All loans', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Returned', value: 'returned' },
];

const SORT_OPTIONS: SelectOption[] = [
  { label: 'Newest first', value: 'desc' },
  { label: 'Oldest first', value: 'asc' },
];

export function LoansScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const currency = useAuthStore((state) => state.user?.currency ?? 'PKR');
  const { categories } = useCategories();

  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);

  const [returnTarget, setReturnTarget] = useState<Loan | null>(null);
  const [returnCategory, setReturnCategory] = useState('');

  const returnLoanMutation = useReturnLoan();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, fromDate, toDate, sortOrder]);

  const filters = useMemo(
    () => ({
      page,
      limit: LIMIT,
      status,
      search: debouncedSearch || undefined,
      startDate: fromDate ? toISODate(fromDate) : undefined,
      endDate: toDate ? toISODate(toDate) : undefined,
      sortBy: 'createdAt',
      sortOrder,
    }),
    [page, status, debouncedSearch, fromDate, toDate, sortOrder],
  );

  const { loans, meta, loading, refreshing, error, refetch } = useLoans(filters);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const categoryOptions = useMemo(() => pickCategoryOptions(categories), [categories]);

  const hasFilters =
    Boolean(search) || status !== 'all' || Boolean(fromDate) || Boolean(toDate) || sortOrder !== 'desc';

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setFromDate(null);
    setToDate(null);
    setSortOrder('desc');
  };

  const openReturn = (loan: Loan) => {
    setReturnTarget(loan);
    setReturnCategory('');
  };

  const confirmReturn = async () => {
    if (!returnTarget || !returnCategory) return;
    try {
      await returnLoanMutation.mutateAsync({
        categoryId: returnCategory,
        loanId: returnTarget._id,
        balance: returnTarget.balance,
      });
      setReturnTarget(null);
      Alert.alert('Success', 'Loan marked as returned.');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Unable to return the loan.');
    }
  };

  const showingFrom = meta && meta.totalItems > 0 ? (meta.currentPage - 1) * meta.perPage + 1 : 0;
  const showingTo = meta ? Math.min(meta.currentPage * meta.perPage, meta.totalItems) : 0;

  return (
    <Screen
      title="Loans"
      icon="hand-left-outline"
      right={
        <Pressable
          onPress={() => setShowFilters((value) => !value)}
          style={[styles.filterButton, hasFilters ? styles.filterButtonActive : null]}
          hitSlop={8}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={hasFilters ? colors.onPrimary : colors.primaryDeep}
          />
        </Pressable>
      }
      refreshing={refreshing}
      onRefresh={refetch}
    >
      {showFilters ? (
        <Card style={styles.filtersCard}>
          <View style={styles.fields}>
            <Input
              label="Search"
              placeholder="Search by name or reason"
              value={search}
              onChangeText={setSearch}
            />
            <View style={styles.filterRow}>
              <View style={styles.filterHalf}>
                <Select
                  label="Status"
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={setStatus}
                  sheetTitle="Loan status"
                />
              </View>
              <View style={styles.filterHalf}>
                <Select
                  label="Sort"
                  options={SORT_OPTIONS}
                  value={sortOrder}
                  onChange={(value) => setSortOrder(value as 'desc' | 'asc')}
                  sheetTitle="Sort order"
                />
              </View>
            </View>
            <View style={styles.dateRow}>
              <DateField label="From" value={fromDate} onChange={setFromDate} />
              <DateField label="To" value={toDate} onChange={setToDate} />
            </View>
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
          Showing {showingFrom}–{showingTo} of {meta.totalItems} loans
        </AppText>
      ) : null}

      {!loading && loans.length === 0 ? (
        <EmptyState
          icon="hand-left-outline"
          title="No loans found"
          message={hasFilters ? 'Try adjusting your filters.' : 'Loans you give will appear here.'}
        />
      ) : null}

      <View style={styles.list}>
        {loans.map((loan) => (
          <Card key={loan._id} style={styles.loanCard}>
            <View style={styles.loanHeader}>
              <View style={styles.loanNameWrap}>
                <AppText variant="h3" numberOfLines={1}>
                  {loan.name}
                </AppText>
                <AppText variant="caption" numberOfLines={2} style={styles.loanReason}>
                  {loan.reason}
                </AppText>
              </View>
              <Badge
                label={loan.status === 'returned' ? 'Returned' : 'Pending'}
                color={loan.status === 'returned' ? colors.success : colors.danger}
                background={loan.status === 'returned' ? colors.successSoft : colors.dangerSoft}
              />
            </View>

            <AppText variant="h2" color={colors.primaryDeep} style={styles.loanAmount}>
              {currency} {formatAmount(loan.balance, currency)}
            </AppText>

            <View style={styles.loanMeta}>
              <View style={styles.metaItem}>
                <AppText variant="caption">Paid on</AppText>
                <AppText variant="label">{formatDate(loan.date)}</AppText>
              </View>
              <View style={styles.metaItem}>
                <AppText variant="caption">Expected return</AppText>
                <AppText variant="label">{formatDate(loan.return)}</AppText>
              </View>
            </View>

            {loan.status === 'pending' ? (
              <Button
                title="Mark as Returned"
                variant="soft"
                size="sm"
                icon="checkmark-circle-outline"
                onPress={() => openReturn(loan)}
                style={styles.returnButton}
              />
            ) : null}
          </Card>
        ))}
      </View>

      {meta ? (
        <Pagination page={meta.currentPage} totalPages={meta.totalPages} onChange={setPage} />
      ) : null}

      <Loader visible={loading && loans.length === 0} message="Loading loans..." />

      <Modal
        visible={Boolean(returnTarget)}
        transparent
        animationType="slide"
        onRequestClose={() => setReturnTarget(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setReturnTarget(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <AppText variant="h3">Return loan</AppText>
            <Pressable onPress={() => setReturnTarget(null)} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          {returnTarget ? (
            <View style={styles.sheetBody}>
              <AppText variant="label">
                {returnTarget.name} · {currency} {formatAmount(returnTarget.balance, currency)}
              </AppText>
              <AppText variant="caption" style={styles.sheetHint}>
                Choose the category that will receive the returned amount.
              </AppText>

              <Select
                label="Deposit to category"
                placeholder="Choose a category"
                options={categoryOptions}
                value={returnCategory}
                onChange={setReturnCategory}
              />

              <Button
                title="Confirm Return"
                variant="success"
                onPress={confirmReturn}
                loading={returnLoanMutation.isPending}
                disabled={returnLoanMutation.isPending || !returnCategory}
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
    filterButton: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterButtonActive: { backgroundColor: colors.primary },
    filtersCard: { marginBottom: Spacing.lg },
    fields: { gap: Spacing.lg },
    filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
    filterHalf: { flexGrow: 1, flexBasis: 148, minWidth: 0 },
    dateRow: { gap: Spacing.md },
    reset: { marginTop: Spacing.md, alignSelf: 'flex-start' },
    summary: { marginBottom: Spacing.md },
    list: { gap: Spacing.md },
    loanCard: { padding: Spacing.lg },
    loanHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
    loanNameWrap: { flex: 1 },
    loanReason: { marginTop: 2 },
    loanAmount: { marginTop: Spacing.md },
    loanMeta: {
      flexDirection: 'row',
      gap: Spacing.xl,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    metaItem: { flex: 1, gap: 2 },
    returnButton: { marginTop: Spacing.lg },
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

export default LoansScreen;
