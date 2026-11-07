/**
 * App configuration.
 *
 * API base URL is picked up from EXPO_PUBLIC_API_URL (see the project `.env`
 * file). Change it there, no code edits needed.
 */

const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') ?? 'http://localhost:3000';

export const config = {
  /** Base URL of the Next.js Personal Wallet backend. */
  apiBaseUrl,

  /** Endpoint paths (must match the Next.js API exactly). */
  api: {
    login: '/api/auth/login',
    currencies: '/api/currency/get-all',
    categoryGet: '/api/user/category/get',
    categoryAdd: '/api/user/category/add',
    categorySwitch: '/api/user/category/switch',
    loanAdd: '/api/user/loan/add',
    loanReturn: '/api/user/loan/return',
    loanHistory: '/api/user/loan/history',
    loanPeople: '/api/user/loan/people',
    todoGet: '/api/user/todo/get',
    todoAdd: '/api/user/todo/add',
    todoUpdate: '/api/user/todo/update',
    todoDelete: '/api/user/todo/delete',
    todoComplete: '/api/user/todo/complete',
    expenses: '/api/user/expenses',
    notifications: '/api/user/notifications',
    userUpdate: '/api/user/update',
    statementData: '/api/user/bank-statement/data',
    statementPdf: '/api/user/bank-statement/pdf',
    incomingsAdd: '/api/user/incomings/add',
    outgoingsAdd: '/api/user/outgoings/add',
  },

  storage: {
    /** SecureStore key where the session cookie token is kept. */
    authToken: 'personal-wallet.token',
    /** AsyncStorage key for persisted user profile. */
    authUser: 'personal-wallet.user',
    /** AsyncStorage key for the persisted light/dark preference. */
    themeMode: 'personal-wallet.theme',
  },
};

export default config;