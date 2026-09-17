import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

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
import { useNotifications } from '../../hooks/useNotifications';
import { Colors, Radius, Spacing } from '../../theme';
import { formatDateTime, toISODate } from '../../utils/format';
import type { NotificationType } from '../../types';

const LIMIT = 10;

const TYPE_LABELS: Record<NotificationType, string> = {
  incoming: 'Income',
  outgoing: 'Expense',
  loan: 'Loan',
  return: 'Return',
  switch: 'Transfer',
};

const TYPE_ICONS: Record<NotificationType, React.ComponentProps<typeof Ionicons>['name']> = {
  incoming: 'arrow-down-circle',
  outgoing: 'arrow-up-circle',
  loan: 'hand-left',
  return: 'checkmark-done-circle',
  switch: 'swap-horizontal',
};

const SORT_OPTIONS: SelectOption[] = [
  { label: 'Newest first', value: 'desc' },
  { label: 'Oldest first', value: 'asc' },
];

export function HistoryScreen() {
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [type, setType] = useState('all');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, type, fromDate, toDate, sortOrder]);

  const filters = useMemo(
    () => ({
      page,
      limit: LIMIT,
      type,
      search: debouncedSearch || undefined,
      startDate: fromDate ? toISODate(fromDate) : undefined,
      endDate: toDate ? toISODate(toDate) : undefined,
      sortBy: 'createdAt',
      sortOrder,
    }),
    [page, type, debouncedSearch, fromDate, toDate, sortOrder],
  );

  const {
    notifications,
    meta,
    availableTypes,
    loading,
    refreshing,
    error,
    refetch,
  } = useNotifications(filters);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const typeOptions: SelectOption[] = useMemo(() => {
    const source: NotificationType[] = availableTypes.length
      ? availableTypes
      : ['incoming', 'outgoing', 'loan', 'return', 'switch'];
    return [{ label: 'All types', value: 'all' }, ...source.map((item) => ({ label: TYPE_LABELS[item], value: item }))];
  }, [availableTypes]);

  const hasFilters =
    Boolean(search) || type !== 'all' || Boolean(fromDate) || Boolean(toDate) || sortOrder !== 'desc';

  const resetFilters = () => {
    setSearch('');
    setType('all');
    setFromDate(null);
    setToDate(null);
    setSortOrder('desc');
  };

  const showingFrom = meta && meta.totalItems > 0 ? (meta.currentPage - 1) * meta.perPage + 1 : 0;
  const showingTo = meta ? Math.min(meta.currentPage * meta.perPage, meta.totalItems) : 0;

  return (
    <Screen
      title="History"
      subtitle="Every transaction in one place"
      icon="time-outline"
      right={
        <Pressable
          onPress={() => setShowFilters((value) => !value)}
          style={[styles.filterButton, hasFilters ? styles.filterButtonActive : null]}
          hitSlop={8}
        >
          <Ionicons name="options-outline" size={18} color={hasFilters ? Colors.onPrimary : Colors.primaryDeep} />
        </Pressable>
      }
      refreshing={refreshing}
      onRefresh={refetch}
    >
      {showFilters ? (
        <Card style={styles.filtersCard}>
          <View style={styles.fields}>
            <Input label="Search" placeholder="Search title or message" value={search} onChangeText={setSearch} />
            <View style={styles.filterRow}>
              <View style={styles.filterHalf}>
                <Select label="Type" options={typeOptions} value={type} onChange={setType} sheetTitle="Transaction type" />
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
            <View style={styles.filterRow}>
              <View style={styles.filterHalf}>
                <DateField label="From" value={fromDate} onChange={setFromDate} />
              </View>
              <View style={styles.filterHalf}>
                <DateField label="To" value={toDate} onChange={setToDate} />
              </View>
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
          Showing {showingFrom}–{showingTo} of {meta.totalItems} records
        </AppText>
      ) : null}

      {!loading && notifications.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title="No transactions yet"
          message={hasFilters ? 'Try adjusting your filters.' : 'Your wallet activity will show up here.'}
        />
      ) : null}

      <View style={styles.list}>
        {notifications.map((item) => (
          <Card key={item._id} style={styles.notificationCard}>
            <View style={styles.notificationRow}>
              <View style={styles.typeIcon}>
                <Ionicons name={TYPE_ICONS[item.type] ?? 'pricetag'} size={18} color={Colors.primary} />
              </View>
              <View style={styles.notificationBody}>
                <AppText variant="body" weight="medium" numberOfLines={2}>
                  {item.title}
                </AppText>
                <AppText variant="caption" numberOfLines={2} style={styles.notificationMessage}>
                  {item.message}
                </AppText>
                <View style={styles.notificationFooter}>
                  <Badge label={TYPE_LABELS[item.type] ?? 'Other'} />
                  <AppText variant="caption">{formatDateTime(item.createdAt)}</AppText>
                </View>
              </View>
            </View>
          </Card>
        ))}
      </View>

      {meta ? <Pagination page={meta.currentPage} totalPages={meta.totalPages} onChange={setPage} /> : null}

      <Loader visible={loading && notifications.length === 0} message="Loading history..." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: { backgroundColor: Colors.primary },
  filtersCard: { marginBottom: Spacing.lg },
  fields: { gap: Spacing.lg },
  filterRow: { flexDirection: 'row', gap: Spacing.md },
  filterHalf: { flex: 1 },
  reset: { marginTop: Spacing.md, alignSelf: 'flex-start' },
  summary: { marginBottom: Spacing.md },
  list: { gap: Spacing.md },
  notificationCard: { padding: Spacing.lg },
  notificationRow: { flexDirection: 'row', gap: Spacing.md },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBody: { flex: 1 },
  notificationMessage: { marginTop: 2 },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
});

export default HistoryScreen;
