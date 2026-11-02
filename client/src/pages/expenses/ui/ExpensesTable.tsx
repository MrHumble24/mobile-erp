import { Trash2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useDeleteExpense, type ExpenseView } from "@/entities/expense"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { toast } from "@/shared/ui/sonner"

function DeleteExpenseButton({ id }: { id: string }) {
  const { t } = useI18n()
  const deleteMutation = useDeleteExpense()

  const handleDelete = () => {
    if (!window.confirm(t("common.confirm"))) return
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success(t("expenses.expenseDeleted")),
      onError: (err: any) => toast.error(err?.message || t("common.error")),
    })
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
      onClick={handleDelete}
      disabled={deleteMutation.isPending}
    >
      <Trash2 className="size-4" />
      <span className="sr-only">{t("expenses.deleteExpense")}</span>
    </Button>
  )
}

function ExpenseTableRow({
  expense,
  hasExpenseManage,
}: {
  expense: ExpenseView
  hasExpenseManage: boolean
}) {
  const { t } = useI18n()

  return (
    <TableRow>
      <TableCell className="font-semibold text-sm">
        {expense.category?.name || "—"}
      </TableCell>
      <TableCell className="font-mono font-bold text-sm text-destructive">
        ${Number(expense.amount).toLocaleString()}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {expense.description || "—"}
      </TableCell>
      <TableCell>
        {expense.isRecurring ? (
          <Badge variant="violet">{t("expenses.isRecurring")}</Badge>
        ) : (
          <Badge variant="outline">—</Badge>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(expense.incurredAt).toLocaleDateString()}
      </TableCell>
      {hasExpenseManage && (
        <TableCell className="text-right">
          <DeleteExpenseButton id={expense.id} />
        </TableCell>
      )}
    </TableRow>
  )
}

export function ExpensesTable({ expenses }: { expenses: ExpenseView[] }) {
  const { t } = useI18n()
  const hasExpenseManage = useAuthStore(
    (s) => s.user?.permissions?.includes("expense.manage") ?? false
  )

  if (expenses.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
        {t("expenses.noExpensesFound")}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("expenses.category")}</TableHead>
          <TableHead>{t("expenses.amount")}</TableHead>
          <TableHead>{t("expenses.description")}</TableHead>
          <TableHead>{t("expenses.isRecurring")}</TableHead>
          <TableHead>{t("expenses.incurredAt")}</TableHead>
          {hasExpenseManage && <TableHead className="text-right">{t("common.actions")}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
          <ExpenseTableRow
            key={expense.id}
            expense={expense}
            hasExpenseManage={hasExpenseManage}
          />
        ))}
      </TableBody>
    </Table>
  )
}
