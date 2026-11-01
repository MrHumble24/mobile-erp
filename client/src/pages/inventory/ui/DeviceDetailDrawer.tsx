import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import {
  useDeviceByImei,
  useDeviceHistory,
  useChangeDeviceStatus,
  DeviceStatusBadge,
  type DeviceView,
  type DeviceStatus,
} from "@/entities/device"
import { Sheet, SheetPopup, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { toast } from "@/shared/ui/sonner"

function QcSummarySection({ qc }: { qc: { passed: boolean; gradeCode: string | null; batteryHealth: number | null } | null }) {
  const { t } = useI18n()
  if (!qc) return <p className="text-sm text-muted-foreground">{t("inventory.noQc")}</p>
  return (
    <div className="rounded-lg border p-3 space-y-1 bg-card/60 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">{t("qc.result")}:</span>
        <span className={qc.passed ? "text-emerald-600 font-semibold" : "text-destructive font-semibold"}>
          {qc.passed ? t("qc.passed") : t("qc.failed")}
        </span>
      </div>
      {qc.gradeCode && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("qc.grade")}:</span>
          <span className="font-medium">{qc.gradeCode}</span>
        </div>
      )}
      {qc.batteryHealth != null && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("qc.batteryHealth")}:</span>
          <span className="font-medium">{qc.batteryHealth}%</span>
        </div>
      )}
    </div>
  )
}

function StatusHistoryList({ history }: { history: Array<{ id: string; fromStatusCode: string | null; toStatusCode: string; reason: string | null; changedAt: string }> }) {
  if (!history || history.length === 0) return <p className="text-sm text-muted-foreground">-</p>
  return (
    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
      {history.map((h) => (
        <div key={h.id} className="text-xs border-l-2 border-primary/40 pl-3 py-1 space-y-0.5">
          <div className="font-medium">
            {h.fromStatusCode ? `${h.fromStatusCode} → ` : ""}{h.toStatusCode}
          </div>
          {h.reason && <div className="text-muted-foreground italic">"{h.reason}"</div>}
          <div className="text-[10px] text-muted-foreground">{new Date(h.changedAt).toLocaleString()}</div>
        </div>
      ))}
    </div>
  )
}

function DeviceSpecsGrid({ device, canViewCost }: { device: DeviceView; canViewCost: boolean }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-3 text-sm border rounded-lg p-3 bg-muted/20">
      <div>
        <span className="text-muted-foreground text-xs">{t("inventory.storage")}:</span>
        <p className="font-medium">{String(device.specs?.storage || "-")}</p>
      </div>
      <div>
        <span className="text-muted-foreground text-xs">{t("inventory.color")}:</span>
        <p className="font-medium">{String(device.specs?.color || "-")}</p>
      </div>
      <div>
        <span className="text-muted-foreground text-xs">{t("inventory.targetPrice")}:</span>
        <p className="font-medium">{device.targetPrice ? `$${device.targetPrice}` : "-"}</p>
      </div>
      {canViewCost && (
        <div>
          <span className="text-muted-foreground text-xs">{t("inventory.landedCost")}:</span>
          <p className="font-medium">${device.landedCost || "0"}</p>
        </div>
      )}
    </div>
  )
}

function StatusChangeForm({ device }: { device: DeviceView }) {
  const { t } = useI18n()
  const [newStatus, setNewStatus] = React.useState<DeviceStatus>("IN_STOCK")
  const [reason, setReason] = React.useState("")
  const changeStatusMutation = useChangeDeviceStatus()

  const handleStatusChange = () => {
    changeStatusMutation.mutate(
      {
        id: device.id,
        dto: { toStatusCode: newStatus, reason: reason || undefined, expectedVersion: device.version },
      },
      {
        onSuccess: () => {
          toast.success(t("common.success"))
          setReason("")
        },
        onError: (err: any) => {
          toast.error(err?.statusCode === 409 ? t("common.retry") : (err?.message || t("common.error")))
        },
      }
    )
  }

  return (
    <div className="space-y-3 pt-3 border-t">
      <h4 className="text-sm font-semibold">{t("inventory.changeStatus")}</h4>
      <div className="space-y-2">
        <Label>{t("inventory.newStatus")}</Label>
        <Select value={newStatus} onValueChange={(v) => setNewStatus(v as DeviceStatus)}>
          <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="IN_STOCK">{t("inventory.statusInStock")}</SelectItem>
            <SelectItem value="DEFECTIVE">{t("inventory.statusDefective")}</SelectItem>
            <SelectItem value="CONSIGNED">{t("inventory.statusConsigned")}</SelectItem>
            <SelectItem value="SOLD">{t("inventory.statusSold")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("inventory.reason")}</Label>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Sabab..." className="h-10" />
      </div>
      <Button className="w-full" onClick={handleStatusChange} disabled={changeStatusMutation.isPending}>
        {changeStatusMutation.isPending ? t("common.loading") : t("common.save")}
      </Button>
    </div>
  )
}

export function DeviceDetailDrawer({
  device,
  open,
  onClose,
}: {
  device: DeviceView | null
  open: boolean
  onClose: () => void
}) {
  const { t } = useI18n()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canChangeStatus = hasPermission("device.status.change")
  const canViewCost = hasPermission("device.cost.view")

  const { data: detail } = useDeviceByImei(device?.imei)
  const { data: history } = useDeviceHistory(device?.id)
  const activeDevice = detail || device

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetPopup className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t("inventory.imeiDetails")}</SheetTitle>
          <SheetDescription className="font-mono text-sm">{activeDevice?.imei}</SheetDescription>
        </SheetHeader>

        {activeDevice && (
          <div className="space-y-5 my-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t("inventory.status")}:</span>
              <DeviceStatusBadge status={activeDevice.statusCode} />
            </div>
            <DeviceSpecsGrid device={activeDevice} canViewCost={canViewCost} />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">{t("inventory.qcInspection")}</h4>
              <QcSummarySection qc={detail?.latestInspection || null} />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">{t("inventory.history")}</h4>
              <StatusHistoryList history={history || []} />
            </div>
            {canChangeStatus && <StatusChangeForm device={activeDevice} />}
          </div>
        )}
      </SheetPopup>
    </Sheet>
  )
}
