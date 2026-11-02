import { z } from "zod"
import type {
  CreateExpenseRecurrenceDto,
  ExpenseRecurrenceView,
  UpdateExpenseRecurrenceDto,
} from "@/entities/expense"

export type Translate = (key: string) => string

export function makeRecurrenceSchema(t: Translate) {
  return z.object({
    categoryId: z.string().min(1, t("expenses.categoryRequired")),
    amount: z.string().refine((v) => Number(v) > 0, t("expenses.amountPositive")),
    vendor: z.string().optional(),
    description: z.string().optional(),
    frequency: z.enum(["monthly", "weekly"]),
    nextDueAt: z.string().min(1, t("expenses.categoryRequired")),
  })
}

export type RecurrenceFormValues = z.infer<ReturnType<typeof makeRecurrenceSchema>>

function todayIso(): string {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

export function toRecurrenceFormValues(
  recurrence?: ExpenseRecurrenceView | null
): RecurrenceFormValues {
  return {
    categoryId: recurrence?.categoryId ?? "",
    amount: recurrence ? String(recurrence.amount) : "",
    vendor: recurrence?.vendor ?? "",
    description: recurrence?.description ?? "",
    frequency: recurrence?.frequency ?? "monthly",
    nextDueAt: (recurrence?.nextDueAt ?? todayIso()).slice(0, 10),
  }
}

function trimOrUndefined(value?: string): string | undefined {
  const v = value?.trim()
  return v ? v : undefined
}

function toBaseDto(values: RecurrenceFormValues) {
  return {
    categoryId: values.categoryId,
    amount: Number(values.amount),
    vendor: trimOrUndefined(values.vendor),
    description: trimOrUndefined(values.description),
    frequency: values.frequency,
    nextDueAt: new Date(values.nextDueAt).toISOString(),
  }
}

export function toCreateRecurrenceDto(
  values: RecurrenceFormValues
): CreateExpenseRecurrenceDto {
  return toBaseDto(values)
}

export function toUpdateRecurrenceDto(
  values: RecurrenceFormValues
): UpdateExpenseRecurrenceDto {
  return toBaseDto(values)
}
