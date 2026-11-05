import { useI18n } from "@/shared/i18n"
import { formatDate, formatMoney } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
import { useReturnsReport } from "@/entities/report"
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

export function ReturnsListBreakdown({ request }: BreakdownProps) {
  const { t } = useI18n()
  const range = request as RangeParams
  const { data, isLoading } = useReturnsReport(range.from, range.to, 1, 100)

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
          <TableHead>{t("catalog.unitCode")}</TableHead>
          <TableHead>{t("inventory.model")}</TableHead>
          <TableHead>{t("reports.reason")}</TableHead>
          <TableHead className="text-right">{t("reports.refund")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="text-sm">{formatDate(r.returnedAt)}</TableCell>
            <TableCell className="font-mono text-xs">{unitCode(r)}</TableCell>
            <TableCell className="text-sm">{r.model}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {r.reason ?? "—"}
            </TableCell>
            <TableCell className="font-mono text-sm text-right font-semibold text-destructive">
              {formatMoney(r.refundAmount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
