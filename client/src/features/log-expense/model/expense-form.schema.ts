import { z } from "zod"
import type {
  CreateExpenseDto,
  ExpenseView,
  UpdateExpenseDto,
} from "@/entities/expense"
import { todayIso } from "@/shared/lib/local-date"

export type Translate = (key: string) => string

/** Schema built with the active locale so validation messages are translated. */
export function makeExpenseFormSchema(t: Translate) {
  return z.object({
    categoryId: z.string().min(1, t("expenses.categoryRequired")),
    amount: z
      .string()
      .refine((v) => Number(v) > 0, t("expenses.amountPositive")),
    vendor: z.string().optional(),
    description: z.string().optional(),
    incurredAt: z
      .string()
      .min(1, t("expenses.dateNotFuture"))
      .refine((v) => v <= todayIso(), t("expenses.dateNotFuture")),
    isRecurring: z.boolean(),
    accountCode: z.string().min(1),
  })
}

export type ExpenseFormValues = z.infer<ReturnType<typeof makeExpenseFormSchema>>

export function toFormValues(expense?: ExpenseView | null): ExpenseFormValues {
  return {
    categoryId: expense?.categoryId ?? "",
    amount: expense ? String(expense.amount) : "",
    vendor: expense?.vendor ?? "",
    description: expense?.description ?? "",
    incurredAt: (expense?.incurredAt ?? todayIso()).slice(0, 10),
    isRecurring: expense?.isRecurring ?? false,
    accountCode: expense?.accountCode ?? "CASH",
  }
}

function trimOrUndefined(value?: string): string | undefined {
  const v = value?.trim()
  return v ? v : undefined
}

function toBaseDto(values: ExpenseFormValues) {
  return {
    categoryId: values.categoryId,
    amount: Number(values.amount),
    vendor: trimOrUndefined(values.vendor),
    description: trimOrUndefined(values.description),
    isRecurring: values.isRecurring,
    incurredAt: new Date(values.incurredAt).toISOString(),
    accountCode: values.accountCode,
  }
}

export function toCreateExpenseDto(values: ExpenseFormValues): CreateExpenseDto {
  return toBaseDto(values)
}

export function toUpdateExpenseDto(values: ExpenseFormValues): UpdateExpenseDto {
  return toBaseDto(values)
}
