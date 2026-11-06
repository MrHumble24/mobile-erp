import type { ReactNode } from "react"
import { useI18n } from "@/shared/i18n"
import { formatDateTime, formatMoney, formatNumber } from "@/shared/lib/format"
import { saleModelName, saleUnitCode } from "@/shared/lib/sale-subject"
import type { SaleView } from "@/entities/sale"
import { PaymentSummary } from "@/entities/ledger"
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

function QuantitySection({ sale }: { sale: SaleView }) {
  const { t } = useI18n()
  return (
    <Section title={t("catalog.quantity")}>
      <p className="text-sm font-semibold">{saleModelName(sale)}</p>
      <Row label={t("catalog.quantity")} value={t("catalog.pieces", { count: sale.quantity ?? 0 })} />
      <Row label={t("catalog.lineTotal")} value={formatMoney(sale.salePrice)} />
    </Section>
  )
}

export function DeviceSection({ sale }: { sale: SaleView }) {
  const { t } = useI18n()
  if (!sale.device) return <QuantitySection sale={sale} />
  const specs = sale.device.specs ?? {}
  const chips = Object.entries(specs).filter(
    ([, v]) => typeof v === "string" || typeof v === "number"
  )
  return (
    <Section title={t("sales.deviceSection")}>
      <p className="text-sm font-semibold">{saleModelName(sale)}</p>
      <p className="font-mono text-xs text-muted-foreground">{saleUnitCode(sale)}</p>
      {sale.device.imei2 && (
        <p className="font-mono text-xs text-muted-foreground">IMEI 2: {sale.device.imei2}</p>
      )}
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

function saleLevelLabel(code: string | null | undefined, t: (k: string) => string): string | null {
  if (!code || code === "RETAIL") return null
  if (code === "WHOLESALE") return t("pricing.levelWholesale")
  if (code === "PARTNER") return t("pricing.levelPartner")
  return code
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
  const discount = Number(sale.discountAmount ?? 0)
  const levelLabel = saleLevelLabel(sale.priceLevelCode, t)
  const pointsSpent = Number(sale.bonus.spent)
  const pointsEarned = Number(sale.bonus.earned)
  return (
    <Section title={t("sales.moneySection")}>
      {levelLabel && <Row label={t("pricing.priceLevel")} value={levelLabel} />}
      {discount > 0 && sale.listPrice != null && (
        <>
          <Row label={t("pricing.listPrice")} value={formatMoney(sale.listPrice)} />
          <Row label={t("pricing.discount")} value={`− ${formatMoney(sale.discountAmount)}`} />
        </>
      )}
      <Row label={t("sales.salePrice")} value={formatMoney(sale.salePrice)} />
      {sale.payments.length > 0 && (
        <Row label={t("balance.paidWith")} value={<PaymentSummary payments={sale.payments} />} />
      )}
      {pointsSpent > 0 && (
        <Row
          label={t("sales.paidWithPoints")}
          value={`− ${formatNumber(sale.bonus.spent)}`}
        />
      )}
      {pointsEarned > 0 && (
        <Row label={t("sales.pointsEarned")} value={formatNumber(sale.bonus.earned)} />
      )}
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

export function TradeInsSection({ sale }: { sale: SaleView }) {
  const { t } = useI18n()
  if (!sale.tradeIns || sale.tradeIns.length === 0) return null
  const total = sale.tradeIns.reduce((sum, ti) => sum + Number(ti.value), 0)
  const paid = Number(sale.salePrice) - total
  return (
    <Section title={t("purchases.tradeInLabel")}>
      {sale.tradeIns.map((ti) => (
        <Row
          key={ti.deviceId}
          label={`${ti.model.brand} ${ti.model.name}${ti.imei || ti.serialNumber ? ` · ${ti.imei ?? ti.serialNumber}` : ""}`}
          value={`− ${formatMoney(ti.value)}`}
        />
      ))}
      <Row label={t("purchases.amountPaid")} value={formatMoney(paid)} />
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
