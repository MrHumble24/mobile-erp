import { useI18n } from "@/shared/i18n"
import { formatDate, formatMoney } from "@/shared/lib/format"
import { saleModelName, saleUnitCode } from "@/shared/lib/sale-subject"
import { useSales, type SaleView } from "@/entities/sale"
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

const channelOf = (sale: SaleView): string => (sale.consignmentId ? "B2B" : "Retail")

function SalesRow({
  sale,
  showCost,
  onNavigate,
}: {
  sale: SaleView
  showCost: boolean
  onNavigate: (path: string) => void
}) {
  return (
    <TableRow className="cursor-pointer" onClick={() => onNavigate(`/sales?id=${sale.id}`)}>
      <TableCell className="text-sm">{formatDate(sale.soldAt)}</TableCell>
      <TableCell className="font-mono text-xs">{saleUnitCode(sale) ?? "—"}</TableCell>
      <TableCell className="text-sm">{saleModelName(sale)}</TableCell>
      <TableCell className="text-sm">{channelOf(sale)}</TableCell>
      <TableCell className="text-sm">{sale.soldBy.name}</TableCell>
      {showCost && (
        <TableCell className="font-mono text-sm text-right text-muted-foreground">
          {formatMoney(sale.landedCostSnapshot)}
        </TableCell>
      )}
      <TableCell className="font-mono text-sm text-right font-semibold">
        {formatMoney(sale.salePrice)}
      </TableCell>
    </TableRow>
  )
}

export function SalesLinesBreakdown({ request, onNavigate, canViewCost }: BreakdownProps) {
  const { t } = useI18n()
  const range = request as RangeParams
  const modelLabel = "label" in request ? request.label : undefined
  const showCost = canViewCost && request.kind === "cogs"
  const { data, isLoading } = useSales({ from: range.from, to: range.to, pageSize: 100 })

  if (isLoading) return <Skeleton className="h-64 w-full rounded-[12px]" />
  const items = (data?.items ?? []).filter(
    (s) => !modelLabel || saleModelName(s) === modelLabel
  )
  if (items.length === 0)
    return <p className="py-8 text-center text-sm text-muted-foreground">{t("reports.empty")}</p>

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("common.date")}</TableHead>
          <TableHead>{t("catalog.unitCode")}</TableHead>
          <TableHead>{t("inventory.model")}</TableHead>
          <TableHead>{t("reports.channel")}</TableHead>
          <TableHead>{t("reports.cashier")}</TableHead>
          {showCost && <TableHead className="text-right">{t("dashboard.cogs")}</TableHead>}
          <TableHead className="text-right">{t("reports.price")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((s) => (
          <SalesRow key={s.id} sale={s} showCost={showCost} onNavigate={onNavigate} />
        ))}
      </TableBody>
    </Table>
  )
}
