import * as React from "react"
import { HandCoins, Undo2, Wrench } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import type { RepairView } from "@/entities/repair"
import { Button } from "@/shared/ui/button"
import { RepairMoneyDialog, type RepairMoneyMode } from "./RepairMoneyDialog"

/** Remaining to pay the outside master, when both figures are visible (cost
 *  permission); otherwise no client cap. */
function outsideRemaining(repair: RepairView): number | undefined {
  if (repair.outsideCost == null || repair.outsidePaid == null) return undefined
  const left = Number(repair.outsideCost) - Number(repair.outsidePaid)
  return left > 0 ? left : 0
}

/** The money buttons on a ticket (`repair.payment`): take payment, refund,
 *  and — for an outside-master ticket — pay the master. */
export function RepairMoneyActions({ repair }: { repair: RepairView }) {
  const { t } = useI18n()
  const canPay = useAuthStore((s) => s.hasPermission("repair.payment"))
  const [mode, setMode] = React.useState<RepairMoneyMode | null>(null)
  if (!canPay) return null

  const outstanding = Number(repair.outstanding)
  const paid = Number(repair.paid)
  const isOutside = repair.master?.kind === "OUTSIDE"
  const caps: Record<RepairMoneyMode, number | undefined> = {
    payment: outstanding,
    refund: paid,
    outside: outsideRemaining(repair),
  }

  return (
    <div className="flex flex-wrap gap-2">
      {!repair.isTerminal && outstanding > 0 && (
        <Button size="sm" className="gap-1.5" onClick={() => setMode("payment")}>
          <HandCoins className="size-4" />
          {t("repairs.takePayment")}
        </Button>
      )}
      {paid > 0 && (
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setMode("refund")}>
          <Undo2 className="size-4" />
          {t("repairs.refund")}
        </Button>
      )}
      {isOutside && (
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setMode("outside")}>
          <Wrench className="size-4" />
          {t("repairs.outsidePayment")}
        </Button>
      )}
      {mode && (
        <RepairMoneyDialog
          repairId={repair.id}
          mode={mode}
          cap={caps[mode]}
          open={mode !== null}
          onOpenChange={(o) => !o && setMode(null)}
        />
      )}
    </div>
  )
}
