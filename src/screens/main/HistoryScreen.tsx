import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useReceipt } from '../../components/receipt/ReceiptProvider';
import {
  AppText,
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
  ToneBadge,
  type BadgeTone,
  type SelectOption,
} from '../../components/ui';
import { useNotifications } from '../../hooks/useNotifications';
import { Radius, Spacing, type ThemeColors } from '../../theme';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { formatDateTime, toISODate } from '../../utils/format';
import { receiptFromNotification } from '../../utils/receipt';
import { toneColors, transactionMeta } from '../../utils/transactionMeta';
import type { NotificationType } from '../../types';

const LIMIT = 10;

const TYPE_LABELS: Record<NotificationType, string> = {
  incoming: 'Income',
  outgoing: 'Expense',
  loan: 'Loan',
  return: 'Return',
  switch: 'Transfer',
  investment: 'Investment',
};

const TYPE_TONES: Record<NotificationType, BadgeTone> = {
  incoming: 'incoming',
  outgoing: 'outgoing',
  loan: 'loan',
  return: 'return',
  switch: 'switch',
  investment: 'investment',
};

const SORT_OPTIONS: SelectOption[] = [
  { label: 'Newest first', value: 'desc' },
  { label: 'Oldest first', value: 'asc' },
];

export function HistoryScreen() {
  const { openReceipt } = useReceipt();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const tones = toneColors(colors);

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
      : ['incoming', 'outgoing', 'loan', 'return', 'switch', 'investment'];
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
      icon="time-outline"
      right={
        <Pressable
          onPress={() => setShowFilters((value) => !value)}
          style={[styles.filterButton, hasFilters ? styles.filterButtonActive : null]}
          hitSlop={8}
        >
          <Ionicons name="options-outline" size={18} color={hasFilters ? colors.onPrimary : colors.primaryDeep} />
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
        {notifications.map((item) => {
          const meta = transactionMeta(item.type);
          const tone = tones[meta.tone];
          return (
            <Pressable
              key={item._id}
              onPress={() => openReceipt(receiptFromNotification(item))}
              style={({ pressed }) => (pressed ? styles.pressed : null)}
            >
              <Card style={styles.notificationCard}>
                <View style={styles.notificationRow}>
                  <View style={[styles.typeIcon, { backgroundColor: tone.bg }]}>
                    <Ionicons name={meta.icon} size={18} color={tone.fg} />
                  </View>
                  <View style={styles.notificationBody}>
                    <AppText variant="body" weight="medium" numberOfLines={2}>
                      {item.title}
                    </AppText>
                    <AppText variant="caption" numberOfLines={2} style={styles.notificationMessage}>
                      {item.message}
                    </AppText>
                    <View style={styles.notificationFooter}>
                      <ToneBadge label={TYPE_LABELS[item.type] ?? 'Other'} tone={TYPE_TONES[item.type] ?? 'other'} />
                      <View style={styles.notificationFooterMeta}>
                        <AppText variant="caption">{formatDateTime(item.createdAt)}</AppText>
                        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                      </View>
                    </View>
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>

      {meta ? <Pagination page={meta.currentPage} totalPages={meta.totalPages} onChange={setPage} /> : null}

      <Loader visible={loading && notifications.length === 0} message="Loading history..." />
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
    pressed: { opacity: 0.85 },
    notificationCard: { padding: Spacing.lg },
    notificationRow: { flexDirection: 'row', gap: Spacing.md },
    typeIcon: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
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
    notificationFooterMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
  });

export default HistoryScreen;
