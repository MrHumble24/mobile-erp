import * as React from "react"
import { Plus, Trash2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useAuthStore } from "@/features/auth"
import {
  useRemoveRepairPart,
  repairErrorKey,
  type RepairPartView,
  type RepairView,
} from "@/entities/repair"
import { Button } from "@/shared/ui/button"
import { toast } from "@/shared/ui/sonner"
import { AddPartDialog } from "./AddPartDialog"

function PartRow({
  part,
  repairId,
  canManage,
}: {
  part: RepairPartView
  repairId: string
  canManage: boolean
}) {
  const { t } = useI18n()
  const remove = useRemoveRepairPart(repairId)
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-border bg-card p-2.5 text-sm">
      <div className="min-w-0">
        <div className="font-semibold truncate">
          {part.name} <span className="font-mono text-muted-foreground">×{part.quantity}</span>
        </div>
        {part.partLineCost != null && (
          <div className="text-xs text-muted-foreground font-mono">
            {formatMoney(part.partLineCost)}
          </div>
        )}
      </div>
      {canManage && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          disabled={remove.isPending}
          aria-label={t("common.delete")}
          onClick={() =>
            remove.mutate(part.id, {
              onSuccess: () => toast.success(t("repairs.partRemoved")),
              onError: (err: Error) => {
                const key = repairErrorKey(err)
                toast.error(key ? t(key) : err.message || t("common.error"))
              },
            })
          }
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      )}
    </div>
  )
}

/** The parts used on a ticket: list, add (quantity product), remove. The add /
 *  remove controls need `repair.manage` and a non-terminal ticket. */
export function RepairPartsManager({ repair }: { repair: RepairView }) {
  const { t } = useI18n()
  const canManage = useAuthStore((s) => s.hasPermission("repair.manage")) && !repair.isTerminal
  const [addOpen, setAddOpen] = React.useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight">{t("repairs.partsTitle")}</h3>
        {canManage && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="size-3.5" />
            {t("repairs.addPart")}
          </Button>
        )}
      </div>
      {repair.parts.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("repairs.noParts")}</p>
      ) : (
        <div className="space-y-2">
          {repair.parts.map((part) => (
            <PartRow key={part.id} part={part} repairId={repair.id} canManage={canManage} />
          ))}
        </div>
      )}
      <AddPartDialog repairId={repair.id} open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}
