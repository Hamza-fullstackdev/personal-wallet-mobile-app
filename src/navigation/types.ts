import type { NavigatorScreenParams } from '@react-navigation/native';

import type { Todo } from '../types';

export type HomeStackParamList = {
  Dashboard: undefined;
  AddIncome: undefined;
  AddExpense: undefined;
  AddCategory: undefined;
  SwitchBalance: undefined;
  GiveLoan: undefined;
  Statement: undefined;
  Loans: undefined;
  ExpenseCalendar: undefined;
  Charts: undefined;
  SpendingHeatmap: undefined;
  ExpenseBubbleMap: undefined;
  SpendingComparison: undefined;
  FinancialStreaks: undefined;
  FinancialReplay: undefined;
  MoneyRiver: undefined;
  ExpenseDna: undefined;
  SalarySurvival: undefined;
  WhatIfLab: undefined;
  FinancialWrapped: undefined;
};

export type LoansStackParamList = {
  Loans: undefined;
};

export type TodosStackParamList = {
  Todos: undefined;
  TodoForm: { todo?: Todo } | undefined;
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
  TodosTab: NavigatorScreenParams<TodosStackParamList> | undefined;
  HistoryTab: NavigatorScreenParams<HistoryStackParamList> | undefined;
  MoreTab: NavigatorScreenParams<MoreStackParamList> | undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
};
