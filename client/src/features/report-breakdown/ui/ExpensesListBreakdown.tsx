import { useI18n } from "@/shared/i18n"
import { formatDate, formatMoney } from "@/shared/lib/format"
import { useExpenses } from "@/entities/expense"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { Skeleton } from "@/shared/ui/skeleton"
import type { BreakdownProps, RangeParams } from "../model/breakdown.types"

export function ExpensesListBreakdown({ request }: BreakdownProps) {
  const { t } = useI18n()
  const range = request as RangeParams
  const categoryId =
    request.kind === "expenseCategory" ? request.categoryId : undefined

  const { data, isLoading } = useExpenses({
    from: range.from,
    to: range.to,
    categoryId,
    pageSize: 100,
  })

  if (isLoading) return <Skeleton className="h-64 w-full rounded-[12px]" />
  const items = data?.items ?? []
  if (items.length === 0)
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("reports.empty")}
      </p>
    )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("common.date")}</TableHead>
          <TableHead>{t("expenses.category")}</TableHead>
          <TableHead>{t("common.notes")}</TableHead>
          <TableHead className="text-right">{t("common.amount")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((e) => (
          <TableRow key={e.id}>
            <TableCell className="text-sm">{formatDate(e.incurredAt)}</TableCell>
            <TableCell className="text-sm">{e.category.name}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {e.description ?? "—"}
            </TableCell>
            <TableCell className="font-mono text-sm text-right font-semibold">
              {formatMoney(e.amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
