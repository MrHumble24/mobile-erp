import * as React from "react"
import { Pencil, Play, Pause, Plus, RefreshCw } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import {
  useExpenseRecurrences,
  useUpdateExpenseRecurrence,
  useGenerateDueExpenses,
  type ExpenseRecurrenceView,
} from "@/entities/expense"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { toast } from "@/shared/ui/sonner"
import { ExpenseRecurrenceDialog } from "./ExpenseRecurrenceDialog"

function ToggleActiveButton({ recurrence }: { recurrence: ExpenseRecurrenceView }) {
  const { t } = useI18n()
  const update = useUpdateExpenseRecurrence()
  const next = !recurrence.isActive
  return (
    <Button
      size="sm"
      variant="outline"
      className="h-8 w-8 p-0"
      disabled={update.isPending}
      onClick={() => update.mutate({ id: recurrence.id, dto: { isActive: next } })}
    >
      {recurrence.isActive ? <Pause className="size-4" /> : <Play className="size-4" />}
      <span className="sr-only">{next ? t("expenses.markActive") : t("expenses.markInactive")}</span>
    </Button>
  )
}

function Toolbar({
  canManage,
  onNew,
}: {
  canManage: boolean
  onNew: () => void
}) {
  const { t } = useI18n()
  const generate = useGenerateDueExpenses()
  if (!canManage) return null
  const run = () =>
    generate.mutate(undefined, {
      onSuccess: (res) => toast.success(t("expenses.generated", { count: res.generated })),
      onError: (err: { message?: string }) => toast.error(err?.message || t("common.error")),
    })
  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="outline" className="gap-1.5" disabled={generate.isPending} onClick={run}>
        <RefreshCw className="size-4" />
        {t("expenses.generateDue")}
      </Button>
      <Button size="sm" className="gap-1.5" onClick={onNew}>
        <Plus className="size-4" />
        {t("expenses.newRecurrence")}
      </Button>
    </div>
  )
}

export function ExpenseRecurringTab({ canManage }: { canManage: boolean }) {
  const { t } = useI18n()
  const { data, isLoading } = useExpenseRecurrences()
  const [editing, setEditing] = React.useState<ExpenseRecurrenceView | null>(null)
  const [open, setOpen] = React.useState(false)

  const openDialog = (recurrence: ExpenseRecurrenceView | null) => {
    setEditing(recurrence)
    setOpen(true)
  }

  if (isLoading) return <Skeleton className="h-96 rounded-[16px]" />

  return (
    <div className="space-y-4">
      <Toolbar canManage={canManage} onNew={() => openDialog(null)} />
      {(data ?? []).length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-[#d4d4d4] rounded-[16px] bg-white">
          {t("expenses.noRecurrences")}
        </div>
      ) : (
        <div className="rounded-[16px] border border-[#e8e8e8] bg-white overflow-hidden shadow-[var(--shadow-xs)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("expenses.category")}</TableHead>
                <TableHead>{t("expenses.amount")}</TableHead>
                <TableHead>{t("expenses.frequency")}</TableHead>
                <TableHead>{t("expenses.nextDueAt")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                {canManage && <TableHead className="text-right">{t("common.actions")}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold text-sm">{r.category?.name || "—"}</TableCell>
                  <TableCell className="font-mono font-bold text-sm">{formatMoney(r.amount)}</TableCell>
                  <TableCell className="text-sm">{t(`expenses.frequency${r.frequency === "weekly" ? "Weekly" : "Monthly"}`)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(r.nextDueAt)}</TableCell>
                  <TableCell>
                    <Badge variant={r.isActive ? "violet" : "outline"}>
                      {r.isActive ? t("expenses.recurrenceActive") : t("common.no")}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => openDialog(r)}>
                          <Pencil className="size-4" />
                          <span className="sr-only">{t("common.edit")}</span>
                        </Button>
                        <ToggleActiveButton recurrence={r} />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <ExpenseRecurrenceDialog recurrence={editing} open={open} onOpenChange={setOpen} />
    </div>
  )
}
