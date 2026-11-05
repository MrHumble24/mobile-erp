import { downloadCsv } from "@/shared/lib/csv"
import { todayIso } from "@/shared/lib/local-date"
import type { ExpenseUserRef, ExpenseView } from "@/entities/expense"

export function recordedByName(user: ExpenseUserRef | null): string {
  if (!user) return ""
  if (!user.profile) return user.email
  return (
    [user.profile.firstName, user.profile.lastName].filter(Boolean).join(" ") ||
    user.email
  )
}

/** Export the current filtered page of expenses. */
export function exportExpensesCsv(expenses: ExpenseView[]): void {
  const headers = [
    "Date",
    "Category",
    "Description",
    "Vendor",
    "Amount",
    "Recurring",
    "Recorded By",
  ]
  const rows = expenses.map((e) => [
    e.incurredAt.slice(0, 10),
    e.category?.name ?? "",
    e.description ?? "",
    e.vendor ?? "",
    e.amount,
    e.isRecurring ? "Yes" : "No",
    recordedByName(e.createdBy),
  ])
  downloadCsv(`expenses-${todayIso()}`, headers, rows)
}
