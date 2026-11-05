import { useI18n } from "@/shared/i18n"
import type { CustomerListItem } from "@/entities/customer"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { CustomerTableRow, type CustomerRowActions } from "./CustomerTableRow"

export function CustomerTable({
  customers,
  canManage,
  actions,
}: {
  customers: CustomerListItem[]
  canManage: boolean
  actions: CustomerRowActions
}) {
  const { t } = useI18n()

  if (customers.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-[#d4d4d4] bg-white p-8 text-center text-sm text-muted-foreground">
        {t("customers.empty")}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-[#e8e8e8] bg-white shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("customers.name")}</TableHead>
            <TableHead>{t("customers.phone")}</TableHead>
            <TableHead>{t("customers.colPurchases")}</TableHead>
            <TableHead>{t("customers.colTotalSpent")}</TableHead>
            <TableHead>{t("customers.colLastPurchase")}</TableHead>
            <TableHead>{t("customers.colWarranty")}</TableHead>
            <TableHead>{t("credit.outstanding")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <CustomerTableRow key={c.id} customer={c} canManage={canManage} actions={actions} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
