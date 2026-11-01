/** Normalized list filter (dates already parsed) passed service → repository. */
export interface ExpenseFilter {
  from?: Date;
  to?: Date;
  categoryId?: string;
  isRecurring?: boolean;
  page: number;
  pageSize: number;
}

export interface ExpenseSummary {
  total: number;
  byCategory: { categoryId: string; name: string; total: number }[];
}
