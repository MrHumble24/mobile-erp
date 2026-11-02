import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useI18n } from "@/shared/i18n"
import {
  useChangeDeviceStatus,
  manualTransitionsFor,
  deviceKeys,
  type DeviceView,
  type DeviceStatus,
} from "@/entities/device"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { toast } from "@/shared/ui/sonner"

const STATUS_LABEL_KEY: Record<string, string> = {
  IN_STOCK: "inventory.statusInStock",
  DEFECTIVE: "inventory.statusDefective",
  CONSIGNED: "inventory.statusConsigned",
  SOLD: "inventory.statusSold",
}

export function StatusChangeForm({ device }: { device: DeviceView }) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const mutation = useChangeDeviceStatus()
  const transitions = manualTransitionsFor(device.statusCode)
  const [newStatus, setNewStatus] = React.useState<DeviceStatus>(transitions[0] ?? "DEFECTIVE")
  const [reason, setReason] = React.useState("")

  const onError = (err: { statusCode?: number; message?: string }) => {
    if (err?.statusCode === 409) {
      queryClient.invalidateQueries({ queryKey: deviceKeys.byImei(device.imei) })
      toast.error(t("inventory.versionConflict"))
      return
    }
    toast.error(err?.message || t("common.error"))
  }

  const handleSubmit = () => {
    mutation.mutate(
      { id: device.id, dto: { toStatusCode: newStatus, reason: reason || undefined, expectedVersion: device.version } },
      { onSuccess: () => { toast.success(t("common.success")); setReason("") }, onError }
    )
  }

  return (
    <div className="space-y-3 pt-3 border-t">
      <h4 className="text-sm font-semibold">{t("inventory.changeStatus")}</h4>
      <p className="text-xs text-muted-foreground">{t("inventory.statusManualHint")}</p>
      {transitions.length === 0 ? null : (
        <StatusForm
          transitions={transitions}
          newStatus={newStatus}
          onStatusChange={setNewStatus}
          reason={reason}
          onReasonChange={setReason}
          onSubmit={handleSubmit}
          isPending={mutation.isPending}
        />
      )}
    </div>
  )
}

function StatusForm({
  transitions,
  newStatus,
  onStatusChange,
  reason,
  onReasonChange,
  onSubmit,
  isPending,
}: {
  transitions: DeviceStatus[]
  newStatus: DeviceStatus
  onStatusChange: (s: DeviceStatus) => void
  reason: string
  onReasonChange: (v: string) => void
  onSubmit: () => void
  isPending: boolean
}) {
  const { t } = useI18n()
  return (
    <>
      <div className="space-y-2">
        <Label>{t("inventory.newStatus")}</Label>
        <Select value={newStatus} onValueChange={(v) => onStatusChange(v as DeviceStatus)}>
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            {transitions.map((s) => (
              <SelectItem key={s} value={s}>{t(STATUS_LABEL_KEY[s] ?? s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("inventory.reason")}</Label>
        <Input value={reason} onChange={(e) => onReasonChange(e.target.value)} className="h-10" />
      </div>
      <Button className="w-full" onClick={onSubmit} disabled={isPending}>
        {isPending ? t("common.loading") : t("common.save")}
      </Button>
    </>
  )
}
