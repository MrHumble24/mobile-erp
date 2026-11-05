import * as React from "react"
import { Repeat2, X, AlertTriangle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { Button } from "@/shared/ui/button"
import { useCartStore } from "../model/cart.store"
import { useTradeInStore } from "../model/trade-in.store"
import { useCartTradeInPlan } from "../model/use-trade-in-plan"
import { TradeInDialog } from "./TradeInDialog"

export interface TradeInSectionProps {
  /** Trade-in is online only; disabled with a message when offline (ADR 0039). */
  offline: boolean
}

function TradeInRow({ label, code, value, onRemove }: { label: string; code: string | null; value: number; onRemove: () => void }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center justify-between rounded-[10px] border border-[#e8e8e8] bg-[#f8f9fa] p-2.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">{label}</p>
        {code && <p className="text-xs font-mono text-muted-foreground truncate">{code}</p>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="font-semibold text-[#e53935]">− {formatMoney(value)}</span>
        <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label={t("common.close")}>
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}

/** The cart's "Trade-in" action + the traded-in phones listed as negative rows. */
export function TradeInSection({ offline }: TradeInSectionProps) {
  const { t } = useI18n()
  const [open, setOpen] = React.useState(false)
  const lines = useCartStore((s) => s.lines)
  const customer = useCartStore((s) => s.customer)
  const tradeIns = useTradeInStore((s) => s.tradeIns)
  const removeTradeIn = useTradeInStore((s) => s.removeTradeIn)
  const plan = useCartTradeInPlan()

  if (lines.length === 0 && tradeIns.length === 0) return null

  const noCustomer = !customer
  const disabled = offline || lines.length === 0 || noCustomer

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full gap-2 font-semibold"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Repeat2 className="size-4" />
        {t("purchases.tradeInAction")}
      </Button>
      {offline && <p className="text-xs text-muted-foreground">{t("purchases.tradeInOffline")}</p>}
      {!offline && noCustomer && lines.length > 0 && (
        <p className="text-xs text-muted-foreground">{t("purchases.tradeInNeedsCustomer")}</p>
      )}
      {tradeIns.map((ti) => (
        <TradeInRow
          key={ti.id}
          label={ti.modelLabel}
          code={ti.imei ?? ti.serialNumber ?? null}
          value={ti.value}
          onRemove={() => removeTradeIn(ti.id)}
        />
      ))}
      {!plan.ok && plan.unplaceable && (
        <p className="flex items-center gap-1.5 text-xs text-amber-600">
          <AlertTriangle className="size-3.5 shrink-0" />
          {t("purchases.tradeInExceedsLine", { model: plan.unplaceable.modelLabel })}
        </p>
      )}
      <TradeInDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
