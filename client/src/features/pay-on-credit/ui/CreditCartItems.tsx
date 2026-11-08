import { Smartphone, Package, Shield, Tag } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import type { CartLine } from "@/features/checkout"
import type { CreditLineDto } from "@/entities/credit"

interface CreditCartItemsProps {
  cartLines?: CartLine[]
  creditLines: CreditLineDto[]
}

export function CreditCartItems({ cartLines, creditLines }: CreditCartItemsProps) {
  const { t } = useI18n()

  if (cartLines && cartLines.length > 0) {
    return (
      <section className="min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold tracking-tight flex items-center gap-2">
            <Package className="size-4 text-primary" />
            {t("credit.cartItems")}
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            {t("pos.lineCount", { count: cartLines.length })}
          </span>
        </div>

        <div className="rounded-[16px] border border-border bg-card divide-y divide-border/60 shadow-[var(--shadow-xs)] overflow-hidden">
          {cartLines.map((line) => {
            const isUnit = line.kind === "unit"
            const name = isUnit
              ? `${line.device.model?.brand ?? ""} ${line.device.model?.name ?? ""}`.trim() || t("credit.goods")
              : line.name
            const specs = isUnit && line.device.specs ? Object.values(line.device.specs).filter(Boolean).join(" · ") : null
            const imei = isUnit ? line.device.imei : null
            const price = line.kind === "unit" ? line.salePrice : line.unitPrice * line.quantity

            return (
              <div key={line.lineId} className="flex items-center justify-between gap-3 p-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-muted text-muted-foreground">
                    {isUnit ? <Smartphone className="size-4" /> : <Package className="size-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      {specs && <span>{specs}</span>}
                      {imei && (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-muted/80 px-1.5 py-0.5 rounded text-foreground/80">
                          <Tag className="size-2.5" />
                          {imei}
                        </span>
                      )}
                      {isUnit && line.warrantyDays > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Shield className="size-2.5 text-primary" />
                          {t("credit.warrantyDaysBadge", { days: line.warrantyDays })}
                        </span>
                      )}
                      {!isUnit && (
                        <span>× {line.quantity}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-sm font-bold tabular-nums">
                    {formatMoney(price)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  // Fallback to creditLines if full CartLine objects are unavailable
  return (
    <section className="min-w-0 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold tracking-tight flex items-center gap-2">
          <Package className="size-4 text-primary" />
          {t("credit.cartItems")}
        </h2>
        <span className="font-mono text-xs text-muted-foreground">
          {t("pos.lineCount", { count: creditLines.length })}
        </span>
      </div>

      <div className="rounded-[16px] border border-border bg-card divide-y divide-border/60 shadow-[var(--shadow-xs)] overflow-hidden">
        {creditLines.map((line, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 p-3.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold">{t("credit.goods")}</p>
              {line.imei && (
                <span className="font-mono text-xs text-muted-foreground">IMEI: {line.imei}</span>
              )}
            </div>
            <span className="font-mono text-sm font-bold tabular-nums">
              {formatMoney(line.salePrice)}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
