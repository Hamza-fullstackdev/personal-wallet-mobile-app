import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  useNavigation,
  type CompositeNavigationProp,
} from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { HomeHeader } from '../../components/dashboard/HomeHeader';
import { MonthlyOverviewCard } from '../../components/dashboard/MonthlyOverviewCard';
import { RecentActivity } from '../../components/dashboard/RecentActivity';
import { UpcomingLoansCard } from '../../components/dashboard/UpcomingLoansCard';
import {
  AppText,
  Banner,
  Button,
  Card,
  EmptyState,
  Loader,
  Screen,
} from '../../components/ui';
import { useCategories } from '../../hooks/useCategories';
import { useLoans } from '../../hooks/useLoans';
import { useStatementData } from '../../hooks/useStatement';
import type { HomeStackParamList, MainTabParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { Colors, Gradients, Radius, Shadows, Spacing } from '../../theme';
import { formatAmount, toISODate } from '../../utils/format';

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  BottomTabNavigationProp<MainTabParamList>
>;
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface QuickAction {
  key: string;
  label: string;
  icon: IoniconName;
  onPress: (nav: Nav) => void;
}

const ACTIONS: QuickAction[] = [
  { key: 'income', label: 'Income', icon: 'arrow-down-circle', onPress: (nav) => nav.navigate('AddIncome') },
  { key: 'expense', label: 'Expense', icon: 'arrow-up-circle', onPress: (nav) => nav.navigate('AddExpense') },
  { key: 'switch', label: 'Transfer', icon: 'swap-horizontal', onPress: (nav) => nav.navigate('SwitchBalance') },
  { key: 'loan', label: 'Give Loan', icon: 'hand-left', onPress: (nav) => nav.navigate('GiveLoan') },
  { key: 'category', label: 'Category', icon: 'folder-open', onPress: (nav) => nav.navigate('AddCategory') },
  { key: 'statement', label: 'Statement', icon: 'document-text', onPress: (nav) => nav.navigate('Statement') },
];

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((state) => state.user);
  const currency = user?.currency ?? 'PKR';

  const { categories, totalBalance, loanBalance, loading, refreshing, error, reload } =
    useCategories(true);

  // This-month window feeds the monthly overview + recent activity widgets.
  const statementQuery = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: toISODate(start), endDate: toISODate(now) };
  }, []);
  const { data: statement } = useStatementData(statementQuery);

  // Pending loans, nearest expected return first, for the "loans to collect" widget.
  const { loans: pendingLoans } = useLoans({
    status: 'pending',
    limit: 5,
    sortBy: 'return',
    sortOrder: 'asc',
  });

  const totalAmount = (totalBalance ?? 0) + (loanBalance ?? 0);
  const total = totalBalance || 0;

  return (
    <Screen scroll showBack={false} onRefresh={reload} refreshing={refreshing}>
      <HomeHeader
        name={user?.name}
        onPressAvatar={() => navigation.navigate('MoreTab')}
      />

      {error ? <Banner message={error} type="error" style={styles.errorBanner} /> : null}

      {/* Hero balance */}
      <LinearGradient
        colors={Gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroCircleLarge} />
        <View style={styles.heroCircleSmall} />

        <AppText variant="label" color="rgba(255,255,255,0.8)">
          Total Amount
        </AppText>
        <AppText variant="display" color={Colors.onPrimary} style={styles.heroAmount}>
          {formatAmount(totalAmount, currency)}
        </AppText>
        <AppText variant="caption" color="rgba(255,255,255,0.75)">
          {currency} · available plus loans given
        </AppText>

        <View style={styles.heroDivider} />

        <View style={styles.heroRow}>
          <View style={styles.heroStat}>
            <AppText variant="caption" color="rgba(255,255,255,0.75)">
              Total Balance
            </AppText>
            <AppText variant="h3" color={Colors.onPrimary} style={styles.heroStatValue}>
              {formatAmount(totalBalance, currency)}
            </AppText>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <AppText variant="caption" color="rgba(255,255,255,0.75)">
              Loan Given
            </AppText>
            <AppText variant="h3" color={Colors.onPrimary} style={styles.heroStatValue}>
              {formatAmount(loanBalance, currency)}
            </AppText>
          </View>
        </View>
      </LinearGradient>

      {/* This month summary */}
      {statement?.summary ? (
        <View style={styles.section}>
          <MonthlyOverviewCard summary={statement.summary} currency={currency} />
        </View>
      ) : null}

      {/* Quick actions */}
      <View style={styles.section}>
        <AppText variant="h3" style={styles.sectionTitle}>
          Quick actions
        </AppText>
        <View style={styles.actionsGrid}>
          {ACTIONS.map((action) => (
            <Pressable
              key={action.key}
              onPress={() => action.onPress(navigation)}
              style={({ pressed }) => [styles.actionTile, pressed ? styles.actionPressed : null]}
            >
              <View style={styles.actionIcon}>
                <Ionicons name={action.icon} size={22} color={Colors.primary} />
              </View>
              <AppText variant="caption" weight="medium" center style={styles.actionLabel}>
                {action.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Loans to collect */}
      <View style={styles.section}>
        <UpcomingLoansCard
          loans={pendingLoans}
          currency={currency}
          onViewAll={() => navigation.navigate('Loans')}
          onGiveLoan={() => navigation.navigate('GiveLoan')}
        />
      </View>

      {/* Recent activity */}
      {statement ? (
        <View style={styles.section}>
          <RecentActivity
            transactions={statement.transactions.slice(0, 5)}
            currency={currency}
            onViewAll={() => navigation.navigate('HistoryTab')}
          />
        </View>
      ) : null}

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AppText variant="h3">Your categories</AppText>
          <AppText variant="caption">{categories.length} total</AppText>
        </View>

        {loading && categories.length === 0 ? (
          <Loader visible transparent message="" />
        ) : null}

        {!loading && categories.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              icon="folder-open-outline"
              title="No categories yet"
              message="Create a category to start tracking your money."
            >
              <Button
                title="Add Category"
                icon="add"
                size="sm"
                fullWidth={false}
                onPress={() => navigation.navigate('AddCategory')}
                style={styles.emptyButton}
              />
            </EmptyState>
          </Card>
        ) : null}

        <View style={styles.categoryList}>
          {categories.map((category) => {
            const share = total > 0 ? Math.min(1, Math.max(0, category.balance / total)) : 0;
            return (
              <Card key={category._id} style={styles.categoryCard}>
                <View style={styles.categoryRow}>
                  <View style={styles.categoryIcon}>
                    <Ionicons name="wallet-outline" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.categoryInfo}>
                    <AppText variant="label" numberOfLines={1}>
                      {category.name}
                    </AppText>
                    <AppText variant="caption" numberOfLines={1} style={styles.categoryDescription}>
                      {category.description}
                    </AppText>
                  </View>
                  <AppText variant="amount">{formatAmount(category.balance, currency)}</AppText>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${share * 100}%` }]} />
                </View>
              </Card>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorBanner: { marginTop: Spacing.lg },
  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginTop: Spacing.xl,
    overflow: 'hidden',
    ...Shadows.card,
  },
  heroCircleLarge: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -70,
    right: -40,
  },
  heroCircleSmall: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -30,
    left: -20,
  },
  heroAmount: { marginTop: Spacing.sm },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: Spacing.xl,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroStat: { flex: 1 },
  heroStatValue: { marginTop: 2 },
  heroStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginHorizontal: Spacing.lg,
  },
  section: { marginTop: Spacing.xxl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  sectionTitle: { marginBottom: Spacing.lg },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionTile: {
    width: '31%',
    flexGrow: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionPressed: { backgroundColor: Colors.primaryFaint },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { color: Colors.textSecondary },
  emptyCard: { padding: 0 },
  emptyButton: { marginTop: Spacing.lg, paddingHorizontal: Spacing.xl },
  categoryList: { gap: Spacing.md },
  categoryCard: { padding: Spacing.lg },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: { flex: 1 },
  categoryDescription: { marginTop: 2 },
  progressTrack: {
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primaryFaint,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
});

export default DashboardScreen;