import * as React from "react"
import { PenLine } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatNumber } from "@/shared/lib/format"
import { useCustomerBonus } from "@/entities/bonus"
import { AdjustBonusDialog } from "@/features/adjust-bonus"
import { Button } from "@/shared/ui/button"
import { CustomerBonusHistory } from "./CustomerBonusHistory"

/** A customer's points: balance and history. Renders nothing while bonus is off. */
export function CustomerBonusPanel({
  customerId,
  canAdjust,
}: {
  customerId: string
  canAdjust: boolean
}) {
  const { t } = useI18n()
  const [open, setOpen] = React.useState(false)
  const { data: bonus } = useCustomerBonus(customerId)

  if (!bonus?.enabled) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight">{t("customers.bonusTitle")}</h3>
        {canAdjust && (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <PenLine className="size-3.5" />
            {t("customers.bonusCorrect")}
          </Button>
        )}
      </div>

      <div className="rounded-[12px] border border-border bg-muted p-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {t("customers.bonusBalance")}
        </div>
        <div className="text-lg font-semibold mt-0.5 tabular-nums">
          {formatNumber(bonus.balance)}
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("customers.bonusHistory")}
        </h4>
        <CustomerBonusHistory history={bonus.history} />
      </div>

      {canAdjust && (
        <AdjustBonusDialog customerId={customerId} open={open} onOpenChange={setOpen} />
      )}
    </div>
  )
}
