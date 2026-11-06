import type { ReactNode } from "react"
import { Eye, Pencil, Repeat, Trash2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import { useDeleteExpense, type ExpenseView } from "@/entities/expense"
import { accountLabel } from "@/entities/ledger"
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
import { recordedByName } from "../lib/expenses-csv"

export interface ExpenseRowActions {
  onDetail: (expense: ExpenseView) => void
  onEdit: (expense: ExpenseView) => void
}

function DeleteExpenseButton({ id }: { id: string }) {
  const { t } = useI18n()
  const deleteMutation = useDeleteExpense()

  const handleDelete = () => {
    if (!window.confirm(t("expenses.deleteConfirm"))) return
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success(t("expenses.expenseDeleted")),
      onError: (err: { message?: string }) =>
        toast.error(err?.message || t("common.error")),
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

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={onClick}>
      {children}
      <span className="sr-only">{label}</span>
    </Button>
  )
}

function ExpenseTableRow({
  expense,
  canManage,
  actions,
}: {
  expense: ExpenseView
  canManage: boolean
  actions: ExpenseRowActions
}) {
  const { t } = useI18n()
  return (
    <TableRow>
      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(expense.incurredAt)}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="gap-1">
          {expense.isRecurring && <Repeat className="size-3" />}
          {expense.category?.name || "—"}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground max-w-[260px] truncate">
        {expense.description || "—"}
      </TableCell>
      <TableCell className="text-sm">{expense.vendor || "—"}</TableCell>
      <TableCell className="font-mono font-bold text-sm text-destructive whitespace-nowrap">
        {formatMoney(expense.amount)}
      </TableCell>
      <TableCell className="text-sm">
        {accountLabel(expense.accountCode, undefined, t)}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {recordedByName(expense.createdBy) || "—"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1.5">
          <IconButton label={t("expenses.detailTitle")} onClick={() => actions.onDetail(expense)}>
            <Eye className="size-4" />
          </IconButton>
          {canManage && (
            <>
              <IconButton label={t("common.edit")} onClick={() => actions.onEdit(expense)}>
                <Pencil className="size-4" />
              </IconButton>
              <DeleteExpenseButton id={expense.id} />
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}

export function ExpensesTable({
  expenses,
  canManage,
  actions,
}: {
  expenses: ExpenseView[]
  canManage: boolean
  actions: ExpenseRowActions
}) {
  const { t } = useI18n()

  if (expenses.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-[16px] bg-card">
        {t("expenses.noExpensesFound")}
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-border bg-card overflow-hidden shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.date")}</TableHead>
            <TableHead>{t("expenses.category")}</TableHead>
            <TableHead>{t("expenses.description")}</TableHead>
            <TableHead>{t("expenses.vendor")}</TableHead>
            <TableHead>{t("expenses.amount")}</TableHead>
            <TableHead>{t("balance.colAccount")}</TableHead>
            <TableHead>{t("expenses.recordedBy")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <ExpenseTableRow
              key={expense.id}
              expense={expense}
              canManage={canManage}
              actions={actions}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
