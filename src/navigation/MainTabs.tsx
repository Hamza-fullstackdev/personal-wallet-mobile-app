import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo } from 'react';

import { Fonts } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import type {
  HistoryStackParamList,
  HomeStackParamList,
  LoansStackParamList,
  MainTabParamList,
  MoreStackParamList,
  TodosStackParamList,
} from './types';
import DashboardScreen from '../screens/main/DashboardScreen';
import AddIncomeScreen from '../screens/main/AddIncomeScreen';
import AddExpenseScreen from '../screens/main/AddExpenseScreen';
import AddCategoryScreen from '../screens/main/AddCategoryScreen';
import SwitchBalanceScreen from '../screens/main/SwitchBalanceScreen';
import GiveLoanScreen from '../screens/main/GiveLoanScreen';
import StatementScreen from '../screens/main/StatementScreen';
import LoansScreen from '../screens/main/LoansScreen';
import TodosScreen from '../screens/main/TodosScreen';
import TodoFormScreen from '../screens/main/TodoFormScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
import ExpenseCalendarScreen from '../screens/main/ExpenseCalendarScreen';
import ChartsScreen from '../screens/main/ChartsScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const LoansStack = createNativeStackNavigator<LoansStackParamList>();
const TodosStack = createNativeStackNavigator<TodosStackParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function HomeStackNavigator() {
  const { colors } = useTheme();
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      animation: 'slide_from_right' as const,
      contentStyle: { backgroundColor: colors.background },
    }),
    [colors.background],
  );

  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStack.Screen name="AddIncome" component={AddIncomeScreen} />
      <HomeStack.Screen name="AddExpense" component={AddExpenseScreen} />
      <HomeStack.Screen name="AddCategory" component={AddCategoryScreen} />
      <HomeStack.Screen name="SwitchBalance" component={SwitchBalanceScreen} />
      <HomeStack.Screen name="GiveLoan" component={GiveLoanScreen} />
      <HomeStack.Screen name="Statement" component={StatementScreen} />
      <HomeStack.Screen name="Loans" component={LoansScreen} />
      <HomeStack.Screen name="ExpenseCalendar" component={ExpenseCalendarScreen} />
      <HomeStack.Screen name="Charts" component={ChartsScreen} />
    </HomeStack.Navigator>
  );
}

function LoansStackNavigator() {
  const { colors } = useTheme();
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      animation: 'slide_from_right' as const,
      contentStyle: { backgroundColor: colors.background },
    }),
    [colors.background],
  );

  return (
    <LoansStack.Navigator screenOptions={screenOptions}>
      <LoansStack.Screen name="Loans" component={LoansScreen} />
    </LoansStack.Navigator>
  );
}

function TodosStackNavigator() {
  const { colors } = useTheme();
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      animation: 'slide_from_right' as const,
      contentStyle: { backgroundColor: colors.background },
    }),
    [colors.background],
  );

  return (
    <TodosStack.Navigator screenOptions={screenOptions}>
      <TodosStack.Screen name="Todos" component={TodosScreen} />
      <TodosStack.Screen name="TodoForm" component={TodoFormScreen} />
    </TodosStack.Navigator>
  );
}

function HistoryStackNavigator() {
  const { colors } = useTheme();
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      animation: 'slide_from_right' as const,
      contentStyle: { backgroundColor: colors.background },
    }),
    [colors.background],
  );

  return (
    <HistoryStack.Navigator screenOptions={screenOptions}>
      <HistoryStack.Screen name="History" component={HistoryScreen} />
    </HistoryStack.Navigator>
  );
}

function MoreStackNavigator() {
  const { colors } = useTheme();
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      animation: 'slide_from_right' as const,
      contentStyle: { backgroundColor: colors.background },
    }),
    [colors.background],
  );

  return (
    <MoreStack.Navigator screenOptions={screenOptions}>
      <MoreStack.Screen name="Settings" component={SettingsScreen} />
    </MoreStack.Navigator>
  );
}

const TAB_ICONS: Record<keyof MainTabParamList, IoniconName> = {
  HomeTab: 'home',
  LoansTab: 'hand-left',
  TodosTab: 'flag',
  HistoryTab: 'time',
  MoreTab: 'settings',
};

export function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: 66,
          paddingTop: 8,
          paddingBottom: 10,
          shadowColor: colors.shadow,
          shadowOpacity: 0.08,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: -4 },
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.medium,
          fontSize: 11,
          marginTop: 2,
        },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={focused ? TAB_ICONS[route.name as keyof MainTabParamList] : (`${TAB_ICONS[route.name as keyof MainTabParamList]}-outline` as IoniconName)}
            size={focused ? size + 2 : size}
            color={color}
          />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Home' }} />
      <Tab.Screen name="LoansTab" component={LoansStackNavigator} options={{ title: 'Loans' }} />
      <Tab.Screen name="TodosTab" component={TodosStackNavigator} options={{ title: 'Todos' }} />
      <Tab.Screen name="HistoryTab" component={HistoryStackNavigator} options={{ title: 'History' }} />
      <Tab.Screen name="MoreTab" component={MoreStackNavigator} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

export default MainTabs;
