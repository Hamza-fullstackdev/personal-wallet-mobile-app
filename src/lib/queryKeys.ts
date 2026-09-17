export type Filters = Record<string, unknown>;

/** Centralised React Query keys. Use the `all` prefixes for invalidation. */
export const queryKeys = {
  categories: ['categories'] as const,
  currencies: ['currencies'] as const,
  loanPeople: ['loan-people'] as const,
  loans: {
    all: ['loans'] as const,
    list: (filters: Filters) => ['loans', filters] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (filters: Filters) => ['notifications', filters] as const,
  },
  statement: {
    all: ['statement'] as const,
    detail: (filters: Filters) => ['statement', filters] as const,
  },
};
