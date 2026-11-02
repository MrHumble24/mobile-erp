import { Receipt } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import type { SaleView } from "@/entities/sale"
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

function SaleInfoCells({ sale }: { sale: SaleView }) {
  const { t } = useI18n()
  const isB2B = Boolean(sale.consignmentId)

  return (
    <>
      <TableCell>
        <div className="font-semibold text-sm">
          {sale.device.model?.brand} {sale.device.model?.name}
        </div>
        <div className="font-mono text-xs text-muted-foreground">{sale.device.imei}</div>
      </TableCell>
      <TableCell>
        <Badge variant={isB2B ? "violet" : "default"}>
          {isB2B ? t("sales.channelB2B") : t("sales.channelRetail")}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="text-sm font-medium">{sale.customer?.name || "—"}</div>
        {sale.customer?.phone && (
          <div className="text-xs text-muted-foreground">{sale.customer.phone}</div>
        )}
      </TableCell>
    </>
  )
}

function SalesTableRow({
  sale,
  hasProfitView,
  onOpenReceipt,
}: {
  sale: SaleView
  hasProfitView: boolean
  onOpenReceipt: (id: string) => void
}) {
  const { t } = useI18n()

  return (
    <TableRow>
      <SaleInfoCells sale={sale} />
      <TableCell className="font-semibold text-sm">
        ${Number(sale.salePrice).toLocaleString()}
      </TableCell>
      {hasProfitView && (
        <TableCell className="font-mono text-sm text-emerald-600 font-semibold">
          {sale.netProfit !== undefined ? `$${Number(sale.netProfit).toLocaleString()}` : "—"}
        </TableCell>
      )}
      <TableCell className="text-xs text-muted-foreground">{sale.soldBy?.name || "—"}</TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(sale.soldAt).toLocaleString()}
      </TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 h-8 text-xs"
          onClick={() => onOpenReceipt(sale.id)}
        >
          <Receipt className="size-3.5" />
          {t("sales.receipt")}
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function SalesTable({
  sales,
  onOpenReceipt,
}: {
  sales: SaleView[]
  onOpenReceipt: (id: string) => void
}) {
  const { t } = useI18n()
  const hasProfitView = useAuthStore(
    (s) => s.user?.permissions?.includes("sale.profit.view") ?? false
  )

  if (sales.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-[#d4d4d4] rounded-[16px] bg-white">
        {t("sales.noSalesFound")}
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-[#e8e8e8] bg-white overflow-hidden shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("inventory.device")}</TableHead>
            <TableHead>{t("sales.filterChannel")}</TableHead>
            <TableHead>{t("sales.customer")}</TableHead>
            <TableHead>{t("sales.salePrice")}</TableHead>
            {hasProfitView && <TableHead>{t("sales.netProfit")}</TableHead>}
            <TableHead>{t("sales.soldBy")}</TableHead>
            <TableHead>{t("sales.soldAt")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <SalesTableRow
              key={sale.id}
              sale={sale}
              hasProfitView={hasProfitView}
              onOpenReceipt={onOpenReceipt}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
