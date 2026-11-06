import { Copy, PackageX, Pencil, ShoppingCart } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { formatMoney, formatDate } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
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
import { DeviceCostSection } from "./DeviceCostSection"
import { UnitPriceSection } from "./UnitPriceSection"

const INSPECTABLE = new Set(["IN_STOCK", "DEFECTIVE"])

function DeviceBarcode({ imei }: { imei: string }) {
  const bars = Array.from({ length: 44 }, (_, i) => ((i * 7 + imei.charCodeAt(i % imei.length)) % 3) + 1)
  return (
    <div className="flex flex-col items-center py-2 px-3 bg-card rounded-[12px] border border-border shadow-[var(--shadow-xs)]">
      <div className="flex items-center gap-[2px] h-9">
        {bars.map((w, idx) => (
          <div key={idx} className="bg-primary h-full rounded-[0.5px]" style={{ width: `${w * 1.5}px` }} />
        ))}
      </div>
      <span className="font-mono text-[11px] tracking-widest text-muted-foreground mt-1">{imei}</span>
    </div>
  )
}

function MarginCard({ targetPrice, landedCost }: { targetPrice: string | null | undefined; landedCost?: string | null }) {
  const { t } = useI18n()
  const price = Number(targetPrice || 0)
  const cost = Number(landedCost || 0)
  const margin = price - cost
  const marginPercent = cost > 0 ? (margin / cost) * 100 : 0
  const isPositive = margin >= 0
  return (
    <div className="flex items-center justify-between p-3 rounded-[12px] bg-card border border-border shadow-[var(--shadow-xs)] text-xs">
      <div>
        <span className="text-muted-foreground">{t("inventory.landedCost")}: </span>
        <span className="font-semibold text-foreground">{formatMoney(landedCost)}</span>
      </div>
      <div>
        <span className="text-muted-foreground">{t("inventory.margin")}: </span>
        <span className={`font-bold ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
          {isPositive ? "+" : ""}{formatMoney(margin)} ({marginPercent.toFixed(1)}%)
        </span>
      </div>
    </div>
  )
}

function SpecCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground text-xs">{label}:</span>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  )
}

function DeviceSpecsGrid({ device, canViewCost }: { device: DeviceDetailView; canViewCost: boolean }) {
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm border border-border rounded-[16px] p-4 bg-muted shadow-[var(--shadow-xs)]">
        <SpecCell label={t("inventory.storage")} value={String(device.specs?.storage || "—")} />
        <SpecCell label={t("inventory.color")} value={String(device.specs?.color || "—")} />
        <SpecCell label={t("inventory.condition")} value={String(device.specs?.condition || "—")} />
        <SpecCell label={t("inventory.ram")} value={String(device.specs?.ram || "—")} />
        <div>
          <span className="text-muted-foreground text-xs">{t("inventory.targetPrice")}:</span>
          <p className="font-bold text-foreground">{formatMoney(device.targetPrice)}</p>
        </div>
        <SpecCell label={t("inventory.intakeDate")} value={formatDate(device.intakeDate)} />
      </div>
      {device.shipmentId === null && (
        <p className="text-xs font-medium text-muted-foreground">{t("purchases.boughtFromCustomer")}</p>
      )}
      {canViewCost && <MarginCard targetPrice={device.targetPrice} landedCost={device.landedCost} />}
    </div>
  )
}

function HistoryList({ history }: { history: Array<{ id: string; fromStatusCode: string | null; toStatusCode: string; reason: string | null; changedAt: string }> }) {
  if (!history || history.length === 0) return <p className="text-sm text-muted-foreground">—</p>
  return (
    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
      {history.map((h) => (
        <div key={h.id} className="text-xs border-l-2 border-foreground/30 pl-3 py-1 space-y-0.5">
          <div className="font-medium text-foreground">{h.fromStatusCode ? `${h.fromStatusCode} → ` : ""}{h.toStatusCode}</div>
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
  onSell,
}: {
  device: DeviceDetailView
  canEdit: boolean
  onEdit?: (d: DeviceView) => void
  onInspect?: (d: DeviceDetailView) => void
  onSell?: (d: DeviceDetailView) => void
}) {
  const { t } = useI18n()
  const canInspect = Boolean(onInspect) && INSPECTABLE.has(device.statusCode)
  const canSell = Boolean(onSell) && device.statusCode === "IN_STOCK"
  return (
    <div className="flex items-center justify-between gap-2">
      <DeviceStatusBadge status={device.statusCode} />
      <div className="flex items-center gap-2">
        {canSell && (
          <Button size="sm" onClick={() => onSell?.(device)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
            <ShoppingCart className="size-4" />
            {t("inventory.sellInPos")}
          </Button>
        )}
        {canInspect && <Button size="sm" onClick={() => onInspect?.(device)}>{t("qc.runInspection")}</Button>}
        {canEdit && onEdit && (
          <Button variant="outline" size="sm" onClick={() => onEdit(device)} className="gap-1.5">
            <Pencil className="size-3.5" />
            {t("inventory.editDevice")}
          </Button>
        )}
      </div>
    </div>
  )
}

function DrawerBody({
  device,
  canViewCost,
  canChangeStatus,
  canEdit,
  canEditExpense,
  canManageCustoms,
  canManagePrices,
  onEdit,
  onInspect,
  onSell,
}: {
  device: DeviceDetailView
  canViewCost: boolean
  canChangeStatus: boolean
  canEdit: boolean
  canEditExpense: boolean
  canManageCustoms: boolean
  canManagePrices: boolean
  onEdit?: (d: DeviceView) => void
  onInspect?: (d: DeviceDetailView) => void
  onSell?: (d: DeviceDetailView) => void
}) {
  const { t } = useI18n()
  const { data: history } = useDeviceHistory(device.id)
  return (
    <div className="space-y-5 my-4 overflow-y-auto">
      <DrawerActions device={device} canEdit={canEdit} onEdit={onEdit} onInspect={onInspect} onSell={onSell} />
      <DeviceBarcode imei={unitCode(device)} />
      {device.imei2 && (
        <p className="text-center font-mono text-xs text-muted-foreground">IMEI 2: {device.imei2}</p>
      )}
      <DeviceSpecsGrid device={device} canViewCost={canViewCost} />
      {canViewCost && (
        <DeviceCostSection
          device={device}
          canEditExpense={canEditExpense}
          canManageCustoms={canManageCustoms}
        />
      )}
      {canManagePrices && <UnitPriceSection device={device} />}
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

function DrawerHeaderMeta({ title, imei, onCopy }: { title: string; imei?: string | null; onCopy: () => void }) {
  const { t } = useI18n()
  return (
    <SheetHeader>
      <SheetTitle className="text-xl font-bold text-foreground">{title}</SheetTitle>
      <SheetDescription className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
        <span>{t("catalog.unitCode")}: {imei}</span>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={onCopy}
          title={t("inventory.copyImei")}
          className="size-6 p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <Copy className="size-3" />
        </Button>
      </SheetDescription>
    </SheetHeader>
  )
}

export interface DeviceDrawerProps {
  imei?: string | null
  open: boolean
  onClose: () => void
  onEdit?: (d: DeviceView) => void
  onInspect?: (d: DeviceDetailView) => void
  onSell?: (d: DeviceDetailView) => void
}

/** Shared device detail drawer: resolves a device by IMEI and renders specs, QC, history and status. */
export function DeviceDrawer({ imei, open, onClose, onEdit, onInspect, onSell }: DeviceDrawerProps) {
  const { t } = useI18n()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const { data: device, isLoading, isError } = useDeviceByImei(imei)

  const handleEdit = onEdit
    ? (d: DeviceView) => {
        toast.dismiss()
        onEdit(d)
      }
    : undefined

  const handleCopyImei = () => {
    if (!imei) return
    navigator.clipboard.writeText(imei)
    toast.success(`${t("inventory.imeiCopied")}: ${imei}`)
  }

  const modelTitle = device?.model ? `${device.model.brand} ${device.model.name}` : t("inventory.imeiDetails")

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetPopup className="w-full sm:max-w-2xl lg:max-w-3xl">
        <DrawerHeaderMeta title={modelTitle} imei={imei} onCopy={handleCopyImei} />
        {isLoading && <div className="my-8 text-center text-muted-foreground">{t("common.loading")}</div>}
        {!isLoading && (isError || !device) && imei && <NotFoundState />}
        {device && (
          <DrawerBody
            device={device}
            canViewCost={hasPermission("device.cost.view")}
            canChangeStatus={hasPermission("device.status.change")}
            canEdit={hasPermission("device.update")}
            canEditExpense={hasPermission("device.expense")}
            canManageCustoms={hasPermission("customs.manage")}
            canManagePrices={hasPermission("price.manage")}
            onEdit={handleEdit}
            onInspect={onInspect}
            onSell={onSell}
          />
        )}
      </SheetPopup>
    </Sheet>
  )
}
