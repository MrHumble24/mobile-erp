import type { ExpenseSortField } from '../dto/expense-query.dto.js';

/** Normalized list filter (dates already parsed) passed service → repository. */
export interface ExpenseFilter {
  from?: Date;
  to?: Date;
  categoryId?: string;
  recordedById?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  isRecurring?: boolean;
  sort: ExpenseSortField;
  dir: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface ExpenseCategoryTotal {
  categoryId: string;
  name: string;
  total: number;
}

export interface ExpenseDailyPoint {
  date: string;
  total: number;
}

export interface ExpenseSummary {
  total: number;
  previousTotal: number;
  count: number;
  byCategory: ExpenseCategoryTotal[];
  topCategory: ExpenseCategoryTotal | null;
  daily: ExpenseDailyPoint[];
}
