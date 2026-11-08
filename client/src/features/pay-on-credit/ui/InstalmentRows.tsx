import { Plus, Trash2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { isPastDue } from "@/entities/credit"
import type { InstalmentDraft } from "../model/use-credit-draft"

export interface InstalmentRowsProps {
  instalments: InstalmentDraft[]
  onAmount: (i: number, v: number) => void
  onDue: (i: number, v: string) => void
  onAdd: () => void
  onRemove: (i: number) => void
}

/** The editable payment plan: each part an amount + a due date, add and remove. */
export function InstalmentRows({ instalments, onAmount, onDue, onAdd, onRemove }: InstalmentRowsProps) {
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      {instalments.map((row, i) => {
        const past = isPastDue(row.dueDate)
        return (
          <div key={i} className="flex items-end gap-2">
            <div className="w-16 shrink-0 whitespace-nowrap pb-2.5 text-xs font-semibold text-muted-foreground">
              {t("credit.instalment", { n: i + 1 })}
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-[11px]">{t("credit.amount")}</Label>
              <Input
                type="number"
                min={0}
                value={row.amount || ""}
                onChange={(e) => onAmount(i, Math.max(0, Number(e.target.value) || 0))}
                className="h-9 font-mono"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-[11px]">{t("credit.dueDate")}</Label>
              <Input
                type="date"
                value={row.dueDate}
                onChange={(e) => onDue(i, e.target.value)}
                className={`h-9 ${past ? "border-destructive text-destructive" : ""}`}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 shrink-0 text-muted-foreground hover:text-red-600"
              onClick={() => onRemove(i)}
              disabled={instalments.length <= 1}
              aria-label={t("credit.removeInstalment")}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )
      })}
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onAdd}>
        <Plus className="size-3.5" />
        {t("credit.addInstalment")}
      </Button>
    </div>
  )
}
