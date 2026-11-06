import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import { Badge } from "@/shared/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import type { CustomerPurchaseView } from "@/entities/customer-purchase"

function unitCodeOf(unit: CustomerPurchaseView["unit"]): string {
  return unit.imei ?? unit.serialNumber ?? "—"
}

function PurchaseRow({ p, onOpen }: { p: CustomerPurchaseView; onOpen: (id: string) => void }) {
  const { t } = useI18n()
  return (
    <TableRow className="cursor-pointer" onClick={() => onOpen(p.id)}>
      <TableCell className="text-sm text-muted-foreground">{formatDate(p.occurredAt)}</TableCell>
      <TableCell>
        <div className="font-semibold">{p.customer.name}</div>
        <div className="font-mono text-xs text-muted-foreground">{p.customer.phone || "—"}</div>
      </TableCell>
      <TableCell>
        {p.unit.model.brand} {p.unit.model.name}
        {p.saleId && (
          <Badge variant="outline" size="sm" className="ml-1.5">{t("purchases.tradeInLabel")}</Badge>
        )}
      </TableCell>
      <TableCell className="font-mono text-xs">{unitCodeOf(p.unit)}</TableCell>
      <TableCell className="font-mono">{p.pricePaid != null ? formatMoney(p.pricePaid) : "—"}</TableCell>
      <TableCell>{p.accountCode ?? "—"}</TableCell>
      <TableCell className="text-sm">{p.soldBy.name}</TableCell>
    </TableRow>
  )
}

export function PurchasesTable({
  purchases,
  onOpen,
}: {
  purchases: CustomerPurchaseView[]
  onOpen: (id: string) => void
}) {
  const { t } = useI18n()

  if (purchases.length === 0) {
    return (
      <div className="rounded-[16px] border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {t("purchases.empty")}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[16px] border border-border bg-card shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.date")}</TableHead>
            <TableHead>{t("purchases.seller")}</TableHead>
            <TableHead>{t("inventory.model")}</TableHead>
            <TableHead>{t("catalog.unitCode")}</TableHead>
            <TableHead>{t("purchases.pricePaid")}</TableHead>
            <TableHead>{t("purchases.account")}</TableHead>
            <TableHead>{t("purchases.soldBy")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {purchases.map((p) => (
            <PurchaseRow key={p.id} p={p} onOpen={onOpen} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
