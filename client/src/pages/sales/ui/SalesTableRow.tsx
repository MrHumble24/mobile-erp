import type { ReactNode } from "react"
import { Eye, Receipt, RotateCcw } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatDateTime, formatMoney } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
import type { SaleView } from "@/entities/sale"
import { PaymentSummary } from "@/entities/ledger"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import { TableCell, TableRow } from "@/shared/ui/table"
import { SaleWarrantyBadge } from "./SaleWarrantyBadge"

export interface SaleRowActions {
  onOpenDetail: (sale: SaleView) => void
  onOpenReceipt: (id: string) => void
  onReturn: (sale: SaleView) => void
}

function IconAction({
  label,
  onClick,
  children,
  variant = "ghost",
}: {
  label: string
  onClick: () => void
  children: ReactNode
  variant?: "ghost" | "outline"
}) {
  return (
    <Button
      size="icon"
      variant={variant}
      className="size-8"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      {children}
    </Button>
  )
}

export function SalesTableRow({
  sale,
  hasProfitView,
  canReturn,
  actions,
}: {
  sale: SaleView
  hasProfitView: boolean
  canReturn: boolean
  actions: SaleRowActions
}) {
  const { t } = useI18n()
  const isB2B = Boolean(sale.consignmentId)

  return (
    <TableRow className="cursor-pointer" onClick={() => actions.onOpenDetail(sale)}>
      <TableCell>
        <div className="text-sm font-semibold">
          {sale.device.model?.brand} {sale.device.model?.name}
        </div>
        <div className="font-mono text-xs text-muted-foreground">{unitCode(sale.device)}</div>
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
      <TableCell className="text-sm font-semibold">
        {formatMoney(sale.salePrice)}
        <PaymentSummary
          payments={sale.payments}
          className="block text-xs font-normal text-muted-foreground"
        />
      </TableCell>
      {hasProfitView && (
        <TableCell className="font-mono text-sm font-semibold text-emerald-600">
          {sale.netProfit !== undefined ? formatMoney(sale.netProfit) : "—"}
        </TableCell>
      )}
      <TableCell>
        <SaleWarrantyBadge sale={sale} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{sale.soldBy?.name || "—"}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{formatDateTime(sale.soldAt)}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <IconAction label={t("sales.actionDetail")} onClick={() => actions.onOpenDetail(sale)}>
            <Eye className="size-4" />
          </IconAction>
          <IconAction label={t("sales.receipt")} onClick={() => actions.onOpenReceipt(sale.id)}>
            <Receipt className="size-4" />
          </IconAction>
          {canReturn && !sale.return && (
            <IconAction label={t("sales.returnDevice")} onClick={() => actions.onReturn(sale)}>
              <RotateCcw className="size-4 text-destructive" />
            </IconAction>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
