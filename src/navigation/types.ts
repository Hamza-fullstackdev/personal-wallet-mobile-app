import type { NavigatorScreenParams } from '@react-navigation/native';

export type HomeStackParamList = {
  Dashboard: undefined;
  AddIncome: undefined;
  AddExpense: undefined;
  AddCategory: undefined;
  SwitchBalance: undefined;
  GiveLoan: undefined;
  Statement: undefined;
  Loans: undefined;
};

export type LoansStackParamList = {
  Loans: undefined;
};

export type HistoryStackParamList = {
  History: undefined;
};

export type MoreStackParamList = {
  Settings: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
  LoansTab: NavigatorScreenParams<LoansStackParamList> | undefined;
  HistoryTab: NavigatorScreenParams<HistoryStackParamList> | undefined;
  MoreTab: NavigatorScreenParams<MoreStackParamList> | undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
};
