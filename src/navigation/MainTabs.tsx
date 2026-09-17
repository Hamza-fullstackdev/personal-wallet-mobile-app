import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { Colors, Fonts } from '../theme';
import type {
  HistoryStackParamList,
  HomeStackParamList,
  LoansStackParamList,
  MainTabParamList,
  MoreStackParamList,
} from './types';
import DashboardScreen from '../screens/main/DashboardScreen';
import AddIncomeScreen from '../screens/main/AddIncomeScreen';
import AddExpenseScreen from '../screens/main/AddExpenseScreen';
import AddCategoryScreen from '../screens/main/AddCategoryScreen';
import SwitchBalanceScreen from '../screens/main/SwitchBalanceScreen';
import GiveLoanScreen from '../screens/main/GiveLoanScreen';
import StatementScreen from '../screens/main/StatementScreen';
import LoansScreen from '../screens/main/LoansScreen';
import HistoryScreen from '../screens/main/HistoryScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const LoansStack = createNativeStackNavigator<LoansStackParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();
const MoreStack = createNativeStackNavigator<MoreStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const STACK_SCREEN_OPTIONS = {
  headerShown: false,
  animation: 'slide_from_right',
  contentStyle: { backgroundColor: Colors.background },
} as const;

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={STACK_SCREEN_OPTIONS}>
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStack.Screen name="AddIncome" component={AddIncomeScreen} />
      <HomeStack.Screen name="AddExpense" component={AddExpenseScreen} />
      <HomeStack.Screen name="AddCategory" component={AddCategoryScreen} />
      <HomeStack.Screen name="SwitchBalance" component={SwitchBalanceScreen} />
      <HomeStack.Screen name="GiveLoan" component={GiveLoanScreen} />
      <HomeStack.Screen name="Statement" component={StatementScreen} />
      <HomeStack.Screen name="Loans" component={LoansScreen} />
    </HomeStack.Navigator>
  );
}

function LoansStackNavigator() {
  return (
    <LoansStack.Navigator screenOptions={STACK_SCREEN_OPTIONS}>
      <LoansStack.Screen name="Loans" component={LoansScreen} />
    </LoansStack.Navigator>
  );
}

function HistoryStackNavigator() {
  return (
    <HistoryStack.Navigator screenOptions={STACK_SCREEN_OPTIONS}>
      <HistoryStack.Screen name="History" component={HistoryScreen} />
    </HistoryStack.Navigator>
  );
}

function MoreStackNavigator() {
  return (
    <MoreStack.Navigator screenOptions={STACK_SCREEN_OPTIONS}>
      <MoreStack.Screen name="Settings" component={SettingsScreen} />
    </MoreStack.Navigator>
  );
}

const TAB_ICONS: Record<keyof MainTabParamList, IoniconName> = {
  HomeTab: 'home',
  LoansTab: 'hand-left',
  HistoryTab: 'time',
  MoreTab: 'settings',
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 0,
          height: 66,
          paddingTop: 8,
          paddingBottom: 10,
          shadowColor: '#3A287A',
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
      <Tab.Screen name="HistoryTab" component={HistoryStackNavigator} options={{ title: 'History' }} />
      <Tab.Screen name="MoreTab" component={MoreStackNavigator} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

export default MainTabs;
