import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useI18n } from "@/shared/i18n"
import {
  useCreateExpense,
  useUpdateExpense,
  type ExpenseView,
} from "@/entities/expense"
import { Dialog, DialogPopup, DialogHeader, DialogTitle } from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Form } from "@/shared/ui/form"
import { toast } from "@/shared/ui/sonner"
import {
  makeExpenseFormSchema,
  toCreateExpenseDto,
  toFormValues,
  toUpdateExpenseDto,
  type ExpenseFormValues,
} from "../model/expense-form.schema"
import { ExpenseFormFields } from "./ExpenseFormFields"

type FormApi = UseFormReturn<ExpenseFormValues>

function useExpenseSubmit(
  expense: ExpenseView | null,
  onDone: () => void,
  onSuccess?: () => void
) {
  const { t } = useI18n()
  const createMutation = useCreateExpense()
  const updateMutation = useUpdateExpense()

  const opts = {
    onSuccess: () => {
      toast.success(t("expenses.expenseSaved"))
      onDone()
      onSuccess?.()
    },
    onError: (err: { message?: string }) =>
      toast.error(err?.message || t("common.error")),
  }

  const submit = (values: ExpenseFormValues) => {
    if (expense) {
      updateMutation.mutate({ id: expense.id, dto: toUpdateExpenseDto(values) }, opts)
    } else {
      createMutation.mutate(toCreateExpenseDto(values), opts)
    }
  }

  return { submit, isPending: createMutation.isPending || updateMutation.isPending }
}

function LogExpenseForm({
  expense,
  onDone,
  onSuccess,
}: {
  expense: ExpenseView | null
  onDone: () => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()
  const form: FormApi = useForm<ExpenseFormValues>({
    resolver: zodResolver(makeExpenseFormSchema(t)),
    defaultValues: toFormValues(expense),
  })
  const { submit, isPending } = useExpenseSubmit(expense, onDone, onSuccess)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-4 my-2">
        <ExpenseFormFields form={form} />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? t("common.loading") : t("common.save")}
        </Button>
      </form>
    </Form>
  )
}

export function LogExpenseDialog({
  expense = null,
  open,
  onOpenChange,
  onSuccess,
}: {
  expense?: ExpenseView | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}) {
  const { t } = useI18n()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {expense ? t("expenses.editExpense") : t("expenses.newExpense")}
          </DialogTitle>
        </DialogHeader>
        {open && (
          <LogExpenseForm
            key={expense?.id ?? "new"}
            expense={expense}
            onDone={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogPopup>
    </Dialog>
  )
}
