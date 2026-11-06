import { useI18n } from "@/shared/i18n"
import type { SaleView } from "@/entities/sale"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { SalesTableRow, type SaleRowActions } from "./SalesTableRow"

export function SalesTable({
  sales,
  hasProfitView,
  canReturn,
  actions,
}: {
  sales: SaleView[]
  hasProfitView: boolean
  canReturn: boolean
  actions: SaleRowActions
}) {
  const { t } = useI18n()

  if (sales.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t("sales.noSalesFound")}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-border bg-white shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("inventory.device")}</TableHead>
            <TableHead>{t("sales.filterChannel")}</TableHead>
            <TableHead>{t("sales.customer")}</TableHead>
            <TableHead>{t("sales.salePrice")}</TableHead>
            {hasProfitView && <TableHead>{t("sales.netProfit")}</TableHead>}
            <TableHead>{t("sales.warranty")}</TableHead>
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
              canReturn={canReturn}
              actions={actions}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
