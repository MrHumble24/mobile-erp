import type { ReactNode } from "react"
import { Pencil } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate, formatDateTime } from "@/shared/lib/format"
import { useExpense, type ExpenseView } from "@/entities/expense"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import {
  Sheet,
  SheetPopup,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/shared/ui/sheet"
import { recordedByName } from "../lib/expenses-csv"

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#f0f0f0] py-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-right">{value}</span>
    </div>
  )
}

function ExpenseBody({
  expense,
  canManage,
  onEdit,
}: {
  expense: ExpenseView
  canManage: boolean
  onEdit: (expense: ExpenseView) => void
}) {
  const { t } = useI18n()
  return (
    <div className="my-4 space-y-4">
      <div className="rounded-[16px] border border-[#e8e8e8] bg-[#f8f9fa] p-4 text-center">
        <p className="font-mono text-3xl font-bold text-destructive">
          {formatMoney(expense.amount)}
        </p>
      </div>
      <div>
        <Row label={t("expenses.category")} value={expense.category?.name ?? "—"} />
        <Row label={t("expenses.incurredAt")} value={formatDate(expense.incurredAt)} />
        <Row label={t("expenses.vendor")} value={expense.vendor || "—"} />
        <Row label={t("expenses.description")} value={expense.description || "—"} />
        <Row
          label={t("expenses.isRecurring")}
          value={
            expense.isRecurring ? (
              <Badge variant="violet">{t("expenses.isRecurring")}</Badge>
            ) : (
              "—"
            )
          }
        />
        <Row label={t("expenses.recordedBy")} value={recordedByName(expense.createdBy) || "—"} />
        <Row label={t("common.date")} value={formatDateTime(expense.createdAt)} />
      </div>
      {canManage && (
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onEdit(expense)}>
          <Pencil className="size-4" /> {t("common.edit")}
        </Button>
      )}
    </div>
  )
}

export function ExpenseDetailSheet({
  expenseId,
  open,
  onClose,
  canManage,
  onEdit,
}: {
  expenseId: string | null
  open: boolean
  onClose: () => void
  canManage: boolean
  onEdit: (expense: ExpenseView) => void
}) {
  const { t } = useI18n()
  const { data: expense, isLoading } = useExpense(open && expenseId ? expenseId : "")

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetPopup className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("expenses.detailTitle")}</SheetTitle>
          <SheetDescription>
            {expenseId ? `#${expenseId.slice(0, 8).toUpperCase()}` : ""}
          </SheetDescription>
        </SheetHeader>
        {isLoading && <Skeleton className="my-4 h-64 rounded-[16px]" />}
        {expense && <ExpenseBody expense={expense} canManage={canManage} onEdit={onEdit} />}
      </SheetPopup>
    </Sheet>
  )
}
