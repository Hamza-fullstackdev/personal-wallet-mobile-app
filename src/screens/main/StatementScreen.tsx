import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  AppText,
  Banner,
  Button,
  Card,
  DateField,
  EmptyState,
  Loader,
  Screen,
  Select,
  ToneBadge,
  type BadgeTone,
  type SelectOption,
} from '../../components/ui';
import { useLoanPeople } from '../../hooks/useLoanPeople';
import { useStatementData } from '../../hooks/useStatement';
import { useDownloadStatementPdf } from '../../hooks/useWalletMutations';
import { useCategories } from '../../hooks/useCategories';
import { useAuthStore } from '../../store/authStore';
import { Radius, Spacing, type ThemeColors } from '../../theme';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { daysAgo, formatAmount, toISODate } from '../../utils/format';

type PeriodFilter = '30' | '60' | '90' | 'all' | 'custom';

const PERIODS: { label: string; value: PeriodFilter }[] = [
  { label: '30 days', value: '30' },
  { label: '60 days', value: '60' },
  { label: '90 days', value: '90' },
  { label: 'All', value: 'all' },
];

const PERSON_TYPES: SelectOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Loan given', value: 'loan' },
  { label: 'Loan returned', value: 'return' },
];

const GENERAL_TYPES: SelectOption[] = [
  { label: 'All', value: 'all' },
  { label: 'Income', value: 'incoming' },
  { label: 'Expense', value: 'outgoing' },
  { label: 'Loan', value: 'loan' },
  { label: 'Return', value: 'return' },
  { label: 'Transfer', value: 'switch' },
];

export function StatementScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const currency = useAuthStore((state) => state.user?.currency ?? 'PKR');
  const { categories } = useCategories();
  const { people } = useLoanPeople();

  const [period, setPeriod] = useState<PeriodFilter>('30');
  const [startDate, setStartDate] = useState<Date | null>(daysAgo(30));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');
  const [person, setPerson] = useState('all');

  const isIndividual = person !== 'all';

  // In individual mode only loan-related types make sense.
  useEffect(() => {
    if (isIndividual && (type === 'incoming' || type === 'outgoing' || type === 'switch')) {
      setType('all');
    }
  }, [isIndividual, type]);

  const query = useMemo(
    () => ({
      startDate: startDate ? toISODate(startDate) : undefined,
      endDate: endDate ? toISODate(endDate) : undefined,
      type: type !== 'all' ? type : undefined,
      category: !isIndividual && category !== 'all' ? category : undefined,
      person: isIndividual ? person : undefined,
    }),
    [startDate, endDate, type, category, person, isIndividual],
  );

  const { data, loading, refreshing, error, refetch } = useStatementData(query);
  const downloadMutation = useDownloadStatementPdf();

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const applyPeriod = (value: PeriodFilter) => {
    setPeriod(value);
    if (value === 'all') {
      setStartDate(null);
      setEndDate(null);
    } else if (value !== 'custom') {
      setStartDate(daysAgo(Number(value)));
      setEndDate(new Date());
    }
  };

  const handleDownload = async () => {
    try {
      await downloadMutation.mutateAsync(query);
    } catch (err) {
      Alert.alert('Download failed', err instanceof Error ? err.message : 'Unable to download the PDF.');
    }
  };

  const downloading = downloadMutation.isPending;
  const summary = data?.summary;

  return (
    <Screen
      title="Bank Statement"
      refreshing={refreshing}
      onRefresh={refetch}
    >
      {/* Period presets */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {PERIODS.map((item) => {
          const active = period === item.value;
          return (
            <Pressable
              key={item.value}
              onPress={() => applyPeriod(item.value)}
              style={[styles.chip, active ? styles.chipActive : null]}
            >
              <AppText variant="caption" weight="semiBold" color={active ? colors.onPrimary : colors.textSecondary}>
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      <Card style={styles.filtersCard}>
        <View style={styles.fields}>
          <View style={styles.dateRow}>
            <DateField
              label="From"
              value={startDate}
              onChange={(date) => {
                setStartDate(date);
                setPeriod('custom');
              }}
            />
            <DateField
              label="To"
              value={endDate}
              onChange={(date) => {
                setEndDate(date);
                setPeriod('custom');
              }}
            />
          </View>

          <Select
            label="Person"
            options={[{ label: 'Everyone', value: 'all' }, ...people.map((name) => ({ label: name, value: name }))]}
            value={person}
            onChange={setPerson}
            sheetTitle="Filter by person"
          />

          <Select
            label="Type"
            options={isIndividual ? PERSON_TYPES : GENERAL_TYPES}
            value={type}
            onChange={setType}
            sheetTitle="Transaction type"
          />

          {!isIndividual ? (
            <Select
              label="Category"
              options={[
                { label: 'All categories', value: 'all' },
                ...categories.map((item) => ({ label: item.name, value: item._id })),
              ]}
              value={category}
              onChange={setCategory}
              sheetTitle="Filter by category"
            />
          ) : null}
        </View>
      </Card>

      {isIndividual ? (
        <Banner
          type="info"
          message={`Individual statement mode — showing ${person}'s loan activity only.`}
          style={styles.banner}
        />
      ) : null}

      {error ? <Banner message={error} type="error" /> : null}

      {data ? (
        <>
          {/* Account & period */}
          <Card style={styles.accountCard}>
            <AppText variant="label">Account holder</AppText>
            <AppText variant="h3">{data.accountHolder?.name}</AppText>
            <AppText variant="caption">{data.accountHolder?.email}</AppText>
            <View style={styles.accountDivider} />
            <View style={styles.accountMetaRow}>
              <View style={styles.accountMetaItem}>
                <AppText variant="caption">Statement ref</AppText>
                <AppText variant="label">{data.period?.statementRef}</AppText>
              </View>
              <View style={styles.accountMetaItem}>
                <AppText variant="caption">Generated</AppText>
                <AppText variant="label">{data.period?.statementDate}</AppText>
              </View>
            </View>
          </Card>

          {/* Summary grid */}
          {summary ? (
            <View style={styles.summaryGrid}>
              <SummaryTile label="Opening" value={summary.openingBalance} currency={currency} />
              <SummaryTile label="Closing" value={summary.closingBalance} currency={currency} highlight />
              <SummaryTile label="Total credit" value={summary.totalCredit} currency={currency} />
              <SummaryTile label="Total debit" value={summary.totalDebit} currency={currency} />
              <SummaryTile label="Income" value={summary.totalIncoming} currency={currency} tone="in" />
              <SummaryTile label="Expense" value={summary.totalOutgoing} currency={currency} tone="out" />
              <SummaryTile label="Loans given" value={summary.totalLoanGiven} currency={currency} tone="out" />
              <SummaryTile label="Loans returned" value={summary.totalLoanReturned} currency={currency} tone="in" />
            </View>
          ) : null}

          <Button
            title={downloading ? 'Preparing PDF...' : 'Download PDF'}
            icon="download-outline"
            onPress={handleDownload}
            loading={downloading}
            disabled={downloading}
            style={styles.downloadButton}
          />

          {/* Transactions */}
          <View style={styles.sectionHeader}>
            <AppText variant="h3">Transactions</AppText>
            <AppText variant="caption">{summary?.transactionCount ?? data.transactions.length} records</AppText>
          </View>

          {data.transactions.length === 0 ? (
            <EmptyState
              icon="document-outline"
              title="No transactions in range"
              message="Adjust the period or filters to see activity."
            />
          ) : (
            <View style={styles.txList}>
              {data.transactions.map((tx) => (
                <Card key={tx.id} style={styles.txCard}>
                  <View style={styles.txHeader}>
                    <View style={styles.txInfo}>
                      <AppText variant="body" weight="medium" numberOfLines={2}>
                        {tx.title}
                      </AppText>
                      <AppText variant="caption" numberOfLines={1} style={styles.txDescription}>
                        {tx.description}
                      </AppText>
                    </View>
                    <ToneBadge label={tx.typeLabel} tone={statementTone(tx.type)} />
                  </View>

                  <View style={styles.txFooter}>
                    <View style={styles.txFooterItem}>
                      <AppText variant="caption">{tx.date}</AppText>
                      {tx.category && tx.category !== '—' ? (
                        <AppText variant="caption" color={colors.primary}>
                          {tx.category}
                        </AppText>
                      ) : null}
                    </View>
                    <View style={styles.txAmounts}>
                      {tx.credit > 0 ? (
                        <AppText variant="amount" color={colors.success}>
                          + {currency} {formatAmount(tx.credit, currency)}
                        </AppText>
                      ) : null}
                      {tx.debit > 0 ? (
                        <AppText variant="amount" color={colors.danger}>
                          - {currency} {formatAmount(tx.debit, currency)}
                        </AppText>
                      ) : null}
                      <AppText variant="caption">Bal {formatAmount(tx.runningBalance, currency)}</AppText>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </>
      ) : null}

      <Loader visible={loading} message="Building statement..." />
    </Screen>
  );
}

function statementTone(type: string): BadgeTone {
  switch (type) {
    case 'incoming':
    case 'return':
      return 'incoming';
    case 'outgoing':
    case 'loan':
      return 'outgoing';
    case 'switch':
      return 'switch';
    default:
      return 'other';
  }
}

function SummaryTile({
  label,
  value,
  currency,
  highlight,
  tone,
}: {
  label: string;
  value: number;
  currency: string;
  highlight?: boolean;
  tone?: 'in' | 'out';
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const toneColor = tone === 'in' ? colors.success : tone === 'out' ? colors.danger : undefined;
  const toneBackground = tone === 'in' ? colors.successFaint : tone === 'out' ? colors.dangerFaint : undefined;

  return (
    <View
      style={[
        styles.summaryTile,
        toneBackground ? { backgroundColor: toneBackground, borderColor: toneColor } : null,
        highlight ? styles.summaryTileHighlight : null,
      ]}
    >
      <AppText variant="caption" color={highlight ? colors.onPrimary : toneColor ?? colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="h3" color={highlight ? colors.onPrimary : toneColor ?? colors.textPrimary} style={styles.summaryValue}>
        {formatAmount(value, currency)}
      </AppText>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  chips: { gap: Spacing.sm, paddingBottom: Spacing.lg },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filtersCard: { marginBottom: Spacing.lg },
  fields: { gap: Spacing.lg },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  filterHalf: { flexGrow: 1, flexBasis: 148, minWidth: 0 },
  dateRow: { gap: Spacing.md },
  banner: { marginBottom: Spacing.lg },
  accountCard: { marginBottom: Spacing.lg },
  accountDivider: { height: 1, backgroundColor: colors.divider, marginVertical: Spacing.md },
  accountMetaRow: { flexDirection: 'row', gap: Spacing.xl },
  accountMetaItem: { flex: 1, gap: 2 },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryTile: {
    width: '47%',
    flexGrow: 1,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  summaryTileHighlight: { backgroundColor: colors.primary, borderColor: colors.primary },
  summaryValue: { marginTop: Spacing.xs },
  downloadButton: { marginBottom: Spacing.xxl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  txList: { gap: Spacing.md },
  txCard: { padding: Spacing.lg },
  txHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  txInfo: { flex: 1 },
  txDescription: { marginTop: 2 },
  txFooter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  txFooterItem: { flex: 1, gap: 2 },
  txAmounts: { alignItems: 'flex-end', gap: 2 },
});

export default StatementScreen;
