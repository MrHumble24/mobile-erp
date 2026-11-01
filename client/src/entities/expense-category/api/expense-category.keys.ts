export const expenseCategoryKeys = {
  all: ["expense-categories"] as const,
  lists: () => [...expenseCategoryKeys.all, "list"] as const,
  list: () => [...expenseCategoryKeys.lists()] as const,
  details: () => [...expenseCategoryKeys.all, "detail"] as const,
  detail: (id: string) => [...expenseCategoryKeys.details(), id] as const,
}
