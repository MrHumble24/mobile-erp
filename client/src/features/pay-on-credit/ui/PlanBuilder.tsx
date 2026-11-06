import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { fromCents } from "@/entities/credit"
import { InstalmentRows } from "./InstalmentRows"
import type { useCreditDraft } from "../model/use-credit-draft"

type Draft = ReturnType<typeof useCreditDraft>

function EvenSplitControls({ draft }: { draft: Draft }) {
  const { t } = useI18n()
  return (
    <div className="space-y-2 rounded-[12px] border border-border bg-muted p-3">
      <Label className="text-xs font-semibold">{t("credit.evenSplit")}</Label>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label className="text-[11px]">{t("credit.parts")}</Label>
          <Input
            type="number"
            min={1}
            value={draft.parts || ""}
            onChange={(e) => draft.setParts(Math.max(1, Math.trunc(Number(e.target.value) || 1)))}
            className="h-9 w-20"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px]">{t("credit.firstDue")}</Label>
          <Input
            type="date"
            value={draft.firstDue}
            onChange={(e) => draft.setFirstDue(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant={draft.frequency === "month" ? "default" : "outline"}
            onClick={() => draft.setFrequency("month")}
          >
            {t("credit.everyMonth")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={draft.frequency === "week" ? "default" : "outline"}
            onClick={() => draft.setFrequency("week")}
          >
            {t("credit.everyWeek")}
          </Button>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={draft.applyEven}>
          {t("common.add")}
        </Button>
      </div>
    </div>
  )
}

/** The payment plan: fill parts evenly, or edit them by hand. Shows "left to plan". */
export function PlanBuilder({ draft }: { draft: Draft }) {
  const { t } = useI18n()
  const remaining = fromCents(draft.remainingCents)
  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">{t("credit.plan")}</Label>
      <EvenSplitControls draft={draft} />
      <InstalmentRows
        instalments={draft.instalments}
        onAmount={draft.setInstalmentAmount}
        onDue={draft.setInstalmentDue}
        onAdd={draft.addInstalment}
        onRemove={draft.removeInstalment}
      />
      <div
        className={`flex items-center justify-between rounded-[10px] border p-2.5 text-sm ${
          draft.remainingCents === 0
            ? "border-border text-muted-foreground"
            : "border-destructive/40 text-destructive font-semibold"
        }`}
      >
        <span>{t("credit.planRemaining")}</span>
        <span className="font-mono">{formatMoney(remaining)}</span>
      </div>
      {draft.hasPastDue && <p className="text-xs text-destructive">{t("credit.errorPastDue")}</p>}
    </div>
  )
}
