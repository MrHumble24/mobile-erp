import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useOnlineStatus } from "@/shared/lib/offline"
import { useCustomerBonus } from "@/entities/bonus"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { useCartStore } from "../model/cart.store"
import { useBonusRedeemStore } from "../model/bonus-redeem.store"
import { useCartTenderPlan } from "../model/use-tender-plan"

/**
 * The cart's points control (ADR 0043). Visible only when bonus is on for a
 * named customer and this cart can take points; offline it says a connection is
 * needed instead of offering an input. Typing above the cap keeps the cap.
 */
export function BonusRedeemControl() {
  const { t } = useI18n()
  const customerId = useCartStore((s) => s.customer?.id)
  const { data: bonus } = useCustomerBonus(customerId ?? "")
  const online = useOnlineStatus()
  const requested = useBonusRedeemStore((s) => s.requested)
  const setRequested = useBonusRedeemStore((s) => s.setRequested)
  const max = useCartTenderPlan().redeem.max
  const [draft, setDraft] = React.useState(() => (requested > 0 ? String(requested) : ""))
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (requested > max) setRequested(max)
  }, [requested, max, setRequested])

  // Keep the field in step with the store unless the cashier is typing in it.
  React.useEffect(() => {
    if (typeof document !== "undefined" && document.activeElement === inputRef.current) return
    setDraft(requested > 0 ? String(requested) : "")
  }, [requested])

  if (!customerId || !bonus?.enabled) return null
  const hasPoints = Number(bonus.balance) > 0
  if (!online) {
    return hasPoints ? (
      <p className="text-xs text-muted-foreground">{t("pos.bonusOffline")}</p>
    ) : null
  }
  if (max <= 0) return null

  const handleChange = (raw: string) => {
    const amount = Number(raw)
    const clamped = raw === "" || !Number.isFinite(amount) ? 0 : Math.max(0, Math.min(amount, max))
    setDraft(raw === "" || !Number.isFinite(amount) || clamped === amount ? raw : String(clamped))
    setRequested(clamped)
  }

  return (
    <div className="space-y-2 rounded-[10px] border border-[#e8e8e8] bg-[#f8f9fa] p-2.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{t("pos.bonusBalance")}</span>
        <span className="font-medium">{formatMoney(bonus.balance)}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{t("pos.bonusMax")}</span>
        <span className="font-medium">{formatMoney(max)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="number"
          min={0}
          max={max}
          step="0.01"
          value={draft}
          placeholder={t("pos.bonusAmount")}
          aria-label={t("pos.bonusAmount")}
          className="h-9"
          onChange={(event) => handleChange(event.target.value)}
          onBlur={() => setDraft(requested > 0 ? String(requested) : "")}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => setRequested(max)}
        >
          {t("pos.bonusUseMax")}
        </Button>
      </div>
    </div>
  )
}
