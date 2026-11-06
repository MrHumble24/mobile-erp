import type { ReactNode } from "react"
import { useI18n } from "@/shared/i18n"
import { formatDateTime, formatMoney } from "@/shared/lib/format"
import { useCustomerPurchase } from "@/entities/customer-purchase"
import { Sheet, SheetPopup, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet"
import { Skeleton } from "@/shared/ui/skeleton"
import { Badge } from "@/shared/ui/badge"
import { Link } from "@/shared/ui/link"

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between items-baseline gap-2 min-w-0 text-sm">
      <span className="text-muted-foreground min-w-0 truncate">{label}:</span>
      <span className="text-right font-medium shrink-0 whitespace-nowrap tabular-nums">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{title}</h4>
      <div className="space-y-1.5 rounded-[14px] border border-border bg-muted p-3.5">{children}</div>
    </div>
  )
}

export function PurchaseDetailSheet({
  purchaseId,
  open,
  onOpenChange,
}: {
  purchaseId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  const { data: p, isLoading } = useCustomerPurchase(open ? purchaseId : null)

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onOpenChange(false)}>
      <SheetPopup className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("purchases.detailTitle")}</SheetTitle>
          <SheetDescription>{purchaseId ? `#${purchaseId.slice(0, 8).toUpperCase()}` : ""}</SheetDescription>
        </SheetHeader>
        {isLoading && <Skeleton className="my-4 h-64 rounded-[16px]" />}
        {p && (
          <div className="my-4 space-y-5">
            <Section title={t("purchases.unit")}>
              <p className="text-sm font-semibold">{p.unit.model.brand} {p.unit.model.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{p.unit.imei ?? p.unit.serialNumber ?? "—"}</p>
              {p.unit.imei2 && <p className="font-mono text-xs text-muted-foreground">IMEI 2: {p.unit.imei2}</p>}
            </Section>
            <Section title={t("purchases.seller")}>
              <Row label={t("common.name")} value={p.customer.name} />
              {p.customer.phone && <Row label={t("common.phone")} value={p.customer.phone} />}
            </Section>
            <Section title={t("purchases.moneySection")}>
              {p.pricePaid != null && <Row label={t("purchases.pricePaid")} value={formatMoney(p.pricePaid)} />}
              <Row label={t("purchases.account")} value={p.accountCode ?? t("purchases.tradeInLabel")} />
              {p.saleId && (
                <div className="pt-1">
                  <Badge variant="outline" size="sm">{t("purchases.tradeInLabel")}</Badge>
                  <Link to="/sales" className="ml-2 text-xs">{t("sales.title")}</Link>
                </div>
              )}
            </Section>
            <Section title={t("purchases.meta")}>
              <Row label={t("purchases.soldBy")} value={p.soldBy.name} />
              <Row label={t("common.date")} value={formatDateTime(p.occurredAt)} />
            </Section>
          </div>
        )}
      </SheetPopup>
    </Sheet>
  )
}
