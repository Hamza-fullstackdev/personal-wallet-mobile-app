import { Ionicons } from "@expo/vector-icons";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import {
  useNavigation,
  type CompositeNavigationProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { AppState, Pressable, StyleSheet, View } from "react-native";

import { MonthlyOverviewCard } from "../../components/dashboard/MonthlyOverviewCard";
import { RecentActivity } from "../../components/dashboard/RecentActivity";
import { UpcomingLoansCard } from "../../components/dashboard/UpcomingLoansCard";
import {
  AppText,
  Banner,
  Button,
  Card,
  EmptyState,
  Loader,
  Screen,
} from "../../components/ui";
import { useCategories } from "../../hooks/useCategories";
import { useLoans } from "../../hooks/useLoans";
import { useStatementData } from "../../hooks/useStatement";
import type {
  HomeStackParamList,
  MainTabParamList,
} from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import { Radius, Shadows, Spacing, type ThemeColors } from "../../theme";
import { useTheme, useThemedStyles } from "../../theme/ThemeProvider";
import {
  AMOUNT_MASK,
  formatAmount,
  initialOf,
  signedAmount,
  toISODate,
} from "../../utils/format";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  BottomTabNavigationProp<MainTabParamList>
>;
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface QuickAction {
  key: string;
  label: string;
  icon: IoniconName;
  onPress: (nav: Nav) => void;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const ACTIONS: QuickAction[] = [
  {
    key: "income",
    label: "Income",
    icon: "arrow-down-circle",
    onPress: (nav) => nav.navigate("AddIncome"),
  },
  {
    key: "expense",
    label: "Expense",
    icon: "arrow-up-circle",
    onPress: (nav) => nav.navigate("AddExpense"),
  },
  {
    key: "switch",
    label: "Transfer",
    icon: "swap-horizontal",
    onPress: (nav) => nav.navigate("SwitchBalance"),
  },
  {
    key: "loan",
    label: "Give Loan",
    icon: "hand-left",
    onPress: (nav) => nav.navigate("GiveLoan"),
  },
  {
    key: "category",
    label: "Category",
    icon: "folder-open",
    onPress: (nav) => nav.navigate("AddCategory"),
  },
  {
    key: "statement",
    label: "Statement",
    icon: "document-text",
    onPress: (nav) => nav.navigate("Statement"),
  },
];

export function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((state) => state.user);
  const currency = user?.currency ?? "PKR";
  const { colors, gradients } = useTheme();
  const styles = useThemedStyles(createStyles);

  // Amounts are masked by default on every app open. They also re-hide when the
  // app is backgrounded so balances are not exposed in the app switcher.
  const [amountsHidden, setAmountsHidden] = useState(true);
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive")
        setAmountsHidden(true);
    });
    return () => subscription.remove();
  }, []);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? "there";

  const {
    categories,
    totalBalance,
    loanBalance,
    loading,
    refreshing,
    error,
    reload,
  } = useCategories(true);

  // This-month window feeds the monthly overview + recent activity widgets.
  const statementQuery = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: toISODate(start), endDate: toISODate(now) };
  }, []);
  const { data: statement } = useStatementData(statementQuery);

  // Pending loans, nearest expected return first, for the "loans to collect" widget.
  const { loans: pendingLoans } = useLoans({
    status: "pending",
    limit: 5,
    sortBy: "return",
    sortOrder: "asc",
  });

  const totalAmount = (totalBalance ?? 0) + (loanBalance ?? 0);
  const total = totalBalance || 0;

  const netFlow = statement?.summary?.netCashFlow ?? 0;
  const netPositive = netFlow >= 0;
  const netChipFg = netPositive ? "#A7F3C4" : "#FFC2BA";
  const netChipBg = netPositive
    ? "rgba(74,222,128,0.16)"
    : "rgba(248,113,113,0.16)";
  const netChipBorder = netPositive
    ? "rgba(74,222,128,0.28)"
    : "rgba(248,113,113,0.28)";

  return (
    <Screen scroll showBack={false} onRefresh={reload} refreshing={refreshing}>
      {error ? (
        <Banner message={error} type='error' style={styles.errorBanner} />
      ) : null}

      {/* Hero balance */}
      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.18)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          pointerEvents='none'
          style={styles.heroSheen}
        />
        <View style={styles.heroOrbLarge} />
        <View style={styles.heroOrbSmall} />

        <View style={styles.heroTop}>
          <View style={styles.heroGreeting}>
            <AppText
              variant='caption'
              color='rgba(255,255,255,0.65)'
              numberOfLines={1}
            >
              {today}
            </AppText>
            <AppText variant='h3' color={colors.onPrimary} numberOfLines={1}>
              {getGreeting()}, {firstName}
            </AppText>
          </View>
          <Pressable
            onPress={() => navigation.navigate("MoreTab")}
            accessibilityRole='button'
            accessibilityLabel='Open profile'
            hitSlop={8}
            style={({ pressed }) => [pressed ? styles.heroPressed : null]}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.32)", "rgba(255,255,255,0.12)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroAvatar}
            >
              <AppText variant='h3' color={colors.onPrimary}>
                {initialOf(user?.name)}
              </AppText>
            </LinearGradient>
          </Pressable>
        </View>

        <View style={styles.heroLabelRow}>
          <AppText variant='label' color='rgba(255,255,255,0.72)'>
            Total balance
          </AppText>
          <Pressable
            onPress={() => setAmountsHidden((previous) => !previous)}
            accessibilityRole='button'
            accessibilityLabel={amountsHidden ? "Show amounts" : "Hide amounts"}
            hitSlop={10}
            style={({ pressed }) => [
              styles.eyeButton,
              pressed ? styles.heroPressed : null,
            ]}
          >
            <Ionicons
              name={amountsHidden ? "eye-off-outline" : "eye-outline"}
              size={15}
              color={colors.onPrimary}
            />
          </Pressable>
        </View>

        <View style={styles.heroAmountRow}>
          <AppText
            variant='h3'
            color='rgba(255,255,255,0.6)'
            style={styles.heroCurrency}
          >
            {currency}
          </AppText>
          <AppText
            variant='display'
            color={colors.onPrimary}
            style={styles.heroAmount}
          >
            {formatAmount(totalAmount, currency, amountsHidden)}
          </AppText>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <View style={styles.heroStatLabel}>
              <Ionicons
                name='wallet-outline'
                size={13}
                color='rgba(255,255,255,0.62)'
              />
              <AppText variant='caption' color='rgba(255,255,255,0.62)'>
                Available
              </AppText>
            </View>
            <AppText
              variant='h3'
              color={colors.onPrimary}
              numberOfLines={1}
              style={styles.heroStatValue}
            >
              {formatAmount(totalBalance, currency, amountsHidden)}
            </AppText>
          </View>

          <View style={styles.heroStatDivider} />

          <View style={styles.heroStat}>
            <View style={styles.heroStatLabel}>
              <Ionicons
                name='hand-left-outline'
                size={13}
                color='rgba(255,255,255,0.62)'
              />
              <AppText variant='caption' color='rgba(255,255,255,0.62)'>
                In loans
              </AppText>
            </View>
            <AppText
              variant='h3'
              color={colors.onPrimary}
              numberOfLines={1}
              style={styles.heroStatValue}
            >
              {formatAmount(loanBalance, currency, amountsHidden)}
            </AppText>
          </View>
        </View>
      </LinearGradient>

      {/* This month summary */}
      {statement?.summary ? (
        <View style={styles.section}>
          <MonthlyOverviewCard
            summary={statement.summary}
            currency={currency}
            hidden={amountsHidden}
          />
        </View>
      ) : null}

      {/* Quick actions */}
      <View style={styles.section}>
        <AppText variant='h3' style={styles.sectionTitle}>
          Quick actions
        </AppText>
        <View style={styles.actionsGrid}>
          {ACTIONS.map((action) => {
            const tone =
              action.key === "income"
                ? { fg: colors.success, bg: colors.successSoft }
                : action.key === "expense" || action.key === "loan"
                  ? { fg: colors.danger, bg: colors.dangerSoft }
                  : { fg: colors.primary, bg: colors.primarySoft };
            return (
              <Pressable
                key={action.key}
                onPress={() => action.onPress(navigation)}
                style={({ pressed }) => [
                  styles.actionTile,
                  pressed ? styles.actionPressed : null,
                ]}
              >
                <View style={[styles.actionIcon, { backgroundColor: tone.bg }]}>
                  <Ionicons name={action.icon} size={22} color={tone.fg} />
                </View>
                <AppText
                  variant='caption'
                  weight='medium'
                  center
                  style={styles.actionLabel}
                >
                  {action.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Loans to collect */}
      <View style={styles.section}>
        <UpcomingLoansCard
          loans={pendingLoans}
          currency={currency}
          hidden={amountsHidden}
          onViewAll={() => navigation.navigate("Loans")}
          onGiveLoan={() => navigation.navigate("GiveLoan")}
        />
      </View>

      {/* Recent activity */}
      {statement ? (
        <View style={styles.section}>
          <RecentActivity
            transactions={statement.transactions.slice(0, 5)}
            currency={currency}
            hidden={amountsHidden}
            onViewAll={() => navigation.navigate("HistoryTab")}
          />
        </View>
      ) : null}

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AppText variant='h3'>Your categories</AppText>
          <AppText variant='caption'>{categories.length} total</AppText>
        </View>

        {loading && categories.length === 0 ? (
          <Loader visible transparent message='' />
        ) : null}

        {!loading && categories.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              icon='folder-open-outline'
              title='No categories yet'
              message='Create a category to start tracking your money.'
            >
              <Button
                title='Add Category'
                icon='add'
                size='sm'
                fullWidth={false}
                onPress={() => navigation.navigate("AddCategory")}
                style={styles.emptyButton}
              />
            </EmptyState>
          </Card>
        ) : null}

        <View style={styles.categoryList}>
          {categories.map((category) => {
            const share =
              total > 0
                ? Math.min(1, Math.max(0, category.balance / total))
                : 0;
            return (
              <Card key={category._id} style={styles.categoryCard}>
                <View style={styles.categoryRow}>
                  <View style={styles.categoryIcon}>
                    <Ionicons
                      name='wallet-outline'
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.categoryInfo}>
                    <AppText variant='label' numberOfLines={1}>
                      {category.name}
                    </AppText>
                    <AppText
                      variant='caption'
                      numberOfLines={1}
                      style={styles.categoryDescription}
                    >
                      {category.description}
                    </AppText>
                  </View>
                  <AppText variant='amount'>
                    {formatAmount(category.balance, currency, amountsHidden)}
                  </AppText>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${share * 100}%` }]}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    errorBanner: { marginTop: Spacing.lg, marginBottom: Spacing.lg },
    hero: {
      borderRadius: Radius.xl,
      padding: Spacing.xxl,
      marginTop: Spacing.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
      ...Shadows.card,
      shadowColor: "#3A1D0D",
      shadowOpacity: 0.28,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 12 },
      elevation: 8,
    },
    heroSheen: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    heroOrbLarge: {
      position: "absolute",
      width: 230,
      height: 230,
      borderRadius: 115,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)",
      top: -110,
      right: -80,
    },
    heroOrbSmall: {
      position: "absolute",
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: "rgba(255,255,255,0.07)",
      bottom: -40,
      left: -30,
    },
    heroTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.md,
    },
    heroGreeting: { flex: 1 },
    heroAvatar: {
      width: 46,
      height: 46,
      borderRadius: Radius.pill,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.3)",
    },
    heroLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      marginTop: Spacing.xxl,
    },
    eyeButton: {
      width: 28,
      height: 28,
      borderRadius: Radius.pill,
      backgroundColor: "rgba(255,255,255,0.16)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.25)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroPressed: { opacity: 0.7 },
    heroAmountRow: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: Spacing.sm,
      marginTop: Spacing.xs,
    },
    heroCurrency: { letterSpacing: 0.4 },
    heroAmount: {
      fontSize: 40,
      lineHeight: 48,
      letterSpacing: -1,
      fontVariant: ["tabular-nums"],
    },
    deltaChip: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: Spacing.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: 5,
      borderRadius: Radius.pill,
      borderWidth: 1,
    },
    heroStats: {
      flexDirection: "row",
      alignItems: "stretch",
      marginTop: Spacing.xxl,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: Radius.lg,
      backgroundColor: "rgba(255,255,255,0.08)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.14)",
    },
    heroStat: { flex: 1 },
    heroStatLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    heroStatValue: {
      marginTop: 4,
      fontVariant: ["tabular-nums"],
    },
    heroStatDivider: {
      width: 1,
      backgroundColor: "rgba(255,255,255,0.16)",
      marginHorizontal: Spacing.md,
    },
    section: { marginTop: Spacing.xxl },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.lg,
    },
    sectionTitle: { marginBottom: Spacing.lg },
    actionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.md,
    },
    actionTile: {
      width: "31%",
      flexGrow: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.divider,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.lg,
      alignItems: "center",
      gap: Spacing.sm,
    },
    actionPressed: { backgroundColor: colors.primaryFaint },
    actionIcon: {
      width: 46,
      height: 46,
      borderRadius: Radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    actionLabel: { color: colors.textSecondary },
    emptyCard: { padding: 0 },
    emptyButton: { marginTop: Spacing.lg, paddingHorizontal: Spacing.xl },
    categoryList: { gap: Spacing.md },
    categoryCard: { padding: Spacing.lg },
    categoryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    categoryIcon: {
      width: 40,
      height: 40,
      borderRadius: Radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    categoryInfo: { flex: 1 },
    categoryDescription: { marginTop: 2 },
    progressTrack: {
      height: 6,
      borderRadius: Radius.pill,
      backgroundColor: colors.primaryFaint,
      marginTop: Spacing.md,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: Radius.pill,
      backgroundColor: colors.primary,
    },
  });

export default DashboardScreen;
