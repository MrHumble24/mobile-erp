import * as React from "react"
import { Pencil } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import type { DeviceDetailView } from "@/entities/device"
import { Button } from "@/shared/ui/button"
import { EditDeviceCostDialog, type CostField } from "./EditDeviceCostDialog"

function CostRow({
  label,
  value,
  note,
  onEdit,
}: {
  label: string
  value: string
  note?: string | null
  onEdit?: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex items-start justify-between gap-2 min-w-0">
      <div className="min-w-0">
        <span className="text-muted-foreground text-xs">{label}:</span>
        <p className="font-medium text-foreground whitespace-nowrap tabular-nums">{value}</p>
        {note && <p className="text-xs text-muted-foreground italic break-words">{note}</p>}
      </div>
      {onEdit && (
        <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={onEdit} title={t("common.edit")}>
          <Pencil className="size-3.5" />
        </Button>
      )}
    </div>
  )
}

/** Phone expense, customs fee and landed cost for cost-permitted users, with the
 *  two hand-edit actions (gated on `device.expense` / `customs.manage`). */
export function DeviceCostSection({
  device,
  canEditExpense,
  canManageCustoms,
}: {
  device: DeviceDetailView
  canEditExpense: boolean
  canManageCustoms: boolean
}) {
  const { t } = useI18n()
  const [editField, setEditField] = React.useState<CostField | null>(null)

  return (
    <div className="space-y-3 rounded-[16px] border border-border bg-muted p-4 text-sm shadow-[var(--shadow-xs)]">
      <CostRow
        label={t("inventory.unitExpense")}
        value={formatMoney(device.unitExpense ?? 0)}
        note={device.unitExpenseNote}
        onEdit={canEditExpense ? () => setEditField("expense") : undefined}
      />
      <CostRow
        label={t("inventory.customsFee")}
        value={formatMoney(device.customsFee ?? 0)}
        onEdit={canManageCustoms ? () => setEditField("customs") : undefined}
      />
      <CostRow label={t("inventory.landedCost")} value={formatMoney(device.landedCost ?? 0)} />

      <EditDeviceCostDialog
        device={device}
        field={editField ?? "expense"}
        open={editField !== null}
        onOpenChange={(open) => !open && setEditField(null)}
      />
    </div>
  )
}
