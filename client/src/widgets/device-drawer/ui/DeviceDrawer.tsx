import { PackageX } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { formatMoney, formatDate } from "@/shared/lib/format"
import {
  useDeviceByImei,
  useDeviceHistory,
  DeviceStatusBadge,
  type DeviceDetailView,
  type DeviceView,
} from "@/entities/device"
import { Sheet, SheetPopup, SheetHeader, SheetTitle, SheetDescription } from "@/shared/ui/sheet"
import { Button } from "@/shared/ui/button"
import { Link } from "@/shared/ui/link"
import { toast } from "@/shared/ui/sonner"
import { StatusChangeForm } from "./StatusChangeForm"
import { QcSummarySection } from "./QcSummarySection"

const INSPECTABLE = new Set(["IN_STOCK", "DEFECTIVE"])

function SpecCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs">{label}:</span>
      <p className="font-medium">{value}</p>
    </div>
  )
}

function DeviceSpecsGrid({ device, canViewCost }: { device: DeviceDetailView; canViewCost: boolean }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm border border-[#e8e8e8] rounded-[16px] p-4 bg-[#f8f9fa] shadow-[var(--shadow-xs)]">
      <SpecCell label={t("inventory.storage")} value={String(device.specs?.storage || "-")} />
      <SpecCell label={t("inventory.color")} value={String(device.specs?.color || "-")} />
      <SpecCell label={t("inventory.ram")} value={String(device.specs?.ram || "-")} />
      <SpecCell label={t("inventory.condition")} value={String(device.specs?.condition || "-")} />
      <SpecCell label={t("inventory.targetPrice")} value={formatMoney(device.targetPrice)} />
      <SpecCell label={t("inventory.intakeDate")} value={formatDate(device.intakeDate)} />
      {canViewCost && <SpecCell label={t("inventory.landedCost")} value={formatMoney(device.landedCost)} />}
    </div>
  )
}

function HistoryList({ history }: { history: Array<{ id: string; fromStatusCode: string | null; toStatusCode: string; reason: string | null; changedAt: string }> }) {
  if (!history || history.length === 0) return <p className="text-sm text-muted-foreground">-</p>
  return (
    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
      {history.map((h) => (
        <div key={h.id} className="text-xs border-l-2 border-primary/40 pl-3 py-1 space-y-0.5">
          <div className="font-medium">{h.fromStatusCode ? `${h.fromStatusCode} → ` : ""}{h.toStatusCode}</div>
          {h.reason && <div className="text-muted-foreground italic">"{h.reason}"</div>}
          <div className="text-[10px] text-muted-foreground">{formatDate(h.changedAt)}</div>
        </div>
      ))}
    </div>
  )
}

function NotFoundState() {
  const { t } = useI18n()
  return (
    <div className="my-8 text-center space-y-3">
      <PackageX className="mx-auto size-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{t("inventory.imeiNotFound")}</p>
      <Link to="/shipments" className="text-sm">{t("inventory.goToIntake")}</Link>
    </div>
  )
}

function DrawerActions({
  device,
  canEdit,
  onEdit,
  onInspect,
}: {
  device: DeviceDetailView
  canEdit: boolean
  onEdit?: (d: DeviceView) => void
  onInspect?: (d: DeviceDetailView) => void
}) {
  const { t } = useI18n()
  const canInspect = Boolean(onInspect) && INSPECTABLE.has(device.statusCode)
  return (
    <div className="flex items-center gap-2">
      {canInspect && (
        <Button size="sm" onClick={() => onInspect?.(device)}>{t("qc.runInspection")}</Button>
      )}
      {canEdit && onEdit && (
        <Button variant="outline" size="sm" onClick={() => onEdit(device)}>{t("inventory.editDevice")}</Button>
      )}
    </div>
  )
}

function DrawerBody({
  device,
  canViewCost,
  canChangeStatus,
  canEdit,
  onEdit,
  onInspect,
}: {
  device: DeviceDetailView
  canViewCost: boolean
  canChangeStatus: boolean
  canEdit: boolean
  onEdit?: (d: DeviceView) => void
  onInspect?: (d: DeviceDetailView) => void
}) {
  const { t } = useI18n()
  const { data: history } = useDeviceHistory(device.id)
  return (
    <div className="space-y-5 my-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <DeviceStatusBadge status={device.statusCode} />
        <DrawerActions device={device} canEdit={canEdit} onEdit={onEdit} onInspect={onInspect} />
      </div>
      <DeviceSpecsGrid device={device} canViewCost={canViewCost} />
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">{t("inventory.qcInspection")}</h4>
        <QcSummarySection qc={device.latestInspection} />
      </div>
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">{t("inventory.history")}</h4>
        <HistoryList history={history || []} />
      </div>
      {canChangeStatus && <StatusChangeForm device={device} />}
    </div>
  )
}

export interface DeviceDrawerProps {
  imei?: string | null
  open: boolean
  onClose: () => void
  onEdit?: (d: DeviceView) => void
  onInspect?: (d: DeviceDetailView) => void
}

/** Shared device detail drawer: resolves a device by IMEI and renders specs, QC, history and status. */
export function DeviceDrawer({ imei, open, onClose, onEdit, onInspect }: DeviceDrawerProps) {
  const { t } = useI18n()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const { data: device, isLoading, isError } = useDeviceByImei(imei)

  const handleEdit = onEdit
    ? (d: DeviceView) => {
        toast.dismiss()
        onEdit(d)
      }
    : undefined

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetPopup className="w-full sm:max-w-3xl lg:max-w-5xl">
        <SheetHeader>
          <SheetTitle>{t("inventory.imeiDetails")}</SheetTitle>
          <SheetDescription className="font-mono text-sm">{imei}</SheetDescription>
        </SheetHeader>
        {isLoading && <div className="my-8 text-center text-muted-foreground">{t("common.loading")}</div>}
        {!isLoading && (isError || !device) && imei && <NotFoundState />}
        {device && (
          <DrawerBody
            device={device}
            canViewCost={hasPermission("device.cost.view")}
            canChangeStatus={hasPermission("device.status.change")}
            canEdit={hasPermission("device.update")}
            onEdit={handleEdit}
            onInspect={onInspect}
          />
        )}
      </SheetPopup>
    </Sheet>
  )
}
