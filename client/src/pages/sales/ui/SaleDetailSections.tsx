import type { ReactNode } from "react"
import { useI18n } from "@/shared/i18n"
import { formatDateTime, formatMoney } from "@/shared/lib/format"
import type { SaleView } from "@/entities/sale"
import { Badge } from "@/shared/ui/badge"
import { Link } from "@/shared/ui/link"
import { SaleWarrantyBadge } from "./SaleWarrantyBadge"

export function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{title}</h4>
      <div className="space-y-1.5 rounded-[14px] border border-[#e8e8e8] bg-[#f8f9fa] p-3.5">
        {children}
      </div>
    </div>
  )
}

export function DeviceSection({ sale }: { sale: SaleView }) {
  const { t } = useI18n()
  const specs = sale.device.specs ?? {}
  const chips = Object.entries(specs).filter(
    ([, v]) => typeof v === "string" || typeof v === "number"
  )
  return (
    <Section title={t("sales.deviceSection")}>
      <p className="text-sm font-semibold">
        {sale.device.model.brand} {sale.device.model.name}
      </p>
      <p className="font-mono text-xs text-muted-foreground">{sale.device.imei}</p>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {chips.map(([k, v]) => (
            <Badge key={k} variant="outline" size="sm">
              {k}: {String(v)}
            </Badge>
          ))}
        </div>
      )}
    </Section>
  )
}

export function CustomerSection({ sale }: { sale: SaleView }) {
  const { t } = useI18n()
  if (!sale.customer) return null
  return (
    <Section title={t("sales.customerSection")}>
      <Row label={t("common.name")} value={sale.customer.name} />
      {sale.customer.phone && <Row label={t("common.phone")} value={sale.customer.phone} />}
      <Link to="/customers" className="text-xs">
        {t("sales.viewCustomer")}
      </Link>
    </Section>
  )
}

export function MoneySection({
  sale,
  canViewProfit,
}: {
  sale: SaleView
  canViewProfit: boolean
}) {
  const { t } = useI18n()
  const showProfit = canViewProfit && sale.netProfit !== undefined
  return (
    <Section title={t("sales.moneySection")}>
      <Row label={t("sales.salePrice")} value={formatMoney(sale.salePrice)} />
      {showProfit && (
        <>
          <Row label={t("inventory.landedCost")} value={formatMoney(sale.landedCostSnapshot)} />
          <Row
            label={t("sales.netProfit")}
            value={<span className="text-emerald-600">{formatMoney(sale.netProfit)}</span>}
          />
        </>
      )}
    </Section>
  )
}

export function SaleMetaSection({ sale }: { sale: SaleView }) {
  const { t } = useI18n()
  return (
    <Section title={t("sales.warranty")}>
      <Row label={t("sales.soldBy")} value={sale.soldBy?.name || "—"} />
      <Row label={t("sales.soldAt")} value={formatDateTime(sale.soldAt)} />
      <div className="flex items-center justify-between pt-1">
        <span className="text-sm text-muted-foreground">{t("sales.warranty")}:</span>
        <SaleWarrantyBadge sale={sale} />
      </div>
      {sale.consignmentId && (
        <Link to="/consignments" className="text-xs">
          {t("sales.viewConsignment")}
        </Link>
      )}
    </Section>
  )
}

export function ReturnSection({ sale }: { sale: SaleView }) {
  const { t } = useI18n()
  if (!sale.return) return null
  return (
    <Section title={t("sales.returnSection")}>
      <Row label={t("sales.returnedAt")} value={formatDateTime(sale.return.returnedAt)} />
      <Row label={t("sales.refundAmount")} value={formatMoney(sale.return.refundAmount)} />
      {sale.return.reason && <Row label={t("sales.returnReason")} value={sale.return.reason} />}
      <Row label={t("sales.processedBy")} value={sale.return.processedBy.name || "—"} />
    </Section>
  )
}
