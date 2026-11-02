import { useNavigate } from "react-router"
import { Copy, PackageX, Pencil, ShoppingCart } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useCartStore } from "@/features/checkout"
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
import type { DeviceTarget } from "../model/use-device-selection"
import { StatusChangeForm } from "./StatusChangeForm"
import { QcSummarySection } from "./QcSummarySection"

function DeviceBarcode({ imei }: { imei: string }) {
  const bars = Array.from({ length: 44 }, (_, i) => ((i * 7 + imei.charCodeAt(i % imei.length)) % 3) + 1)
  return (
    <div className="flex flex-col items-center py-2 px-3 bg-white rounded-[12px] border border-[#e8e8e8] shadow-[var(--shadow-xs)]">
      <div className="flex items-center gap-[2px] h-9">
        {bars.map((w, idx) => (
          <div key={idx} className="bg-[#202020] h-full rounded-[0.5px]" style={{ width: `${w * 1.5}px` }} />
        ))}
      </div>
      <span className="font-mono text-[11px] tracking-widest text-[#646464] mt-1">{imei}</span>
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
    <div className="flex items-center justify-between p-3 rounded-[12px] bg-white border border-[#e8e8e8] shadow-[var(--shadow-xs)] text-xs">
      <div>
        <span className="text-[#838383]">{t("inventory.landedCost")}: </span>
        <span className="font-semibold text-[#202020]">{formatMoney(landedCost)}</span>
      </div>
      <div>
        <span className="text-[#838383]">{t("inventory.margin")}: </span>
        <span className={`font-bold ${isPositive ? "text-[#10b981]" : "text-[#e53935]"}`}>
          {isPositive ? "+" : ""}{formatMoney(margin)} ({marginPercent.toFixed(1)}%)
        </span>
      </div>
    </div>
  )
}

function DeviceSpecsGrid({ device, canViewCost }: { device: DeviceDetailView; canViewCost: boolean }) {
  const { t } = useI18n()
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm border border-[#e8e8e8] rounded-[16px] p-4 bg-[#f8f9fa] shadow-[var(--shadow-xs)]">
        <div>
          <span className="text-[#838383] text-xs">{t("inventory.storage")}:</span>
          <p className="font-medium text-[#202020]">{String(device.specs?.storage || "—")}</p>
        </div>
        <div>
          <span className="text-[#838383] text-xs">{t("inventory.color")}:</span>
          <p className="font-medium text-[#202020]">{String(device.specs?.color || "—")}</p>
        </div>
        <div>
          <span className="text-[#838383] text-xs">{t("inventory.condition")}:</span>
          <p className="font-medium text-[#202020]">{String(device.specs?.condition || "—")}</p>
        </div>
        <div>
          <span className="text-[#838383] text-xs">{t("inventory.ram")}:</span>
          <p className="font-medium text-[#202020]">{String(device.specs?.ram || "—")}</p>
        </div>
        <div>
          <span className="text-[#838383] text-xs">{t("inventory.targetPrice")}:</span>
          <p className="font-bold text-[#090c1d]">{formatMoney(device.targetPrice)}</p>
        </div>
        <div>
          <span className="text-[#838383] text-xs">{t("inventory.intakeDate")}:</span>
          <p className="font-medium text-[#202020]">{formatDate(device.intakeDate)}</p>
        </div>
      </div>
      {canViewCost && (
        <MarginCard targetPrice={device.targetPrice} landedCost={device.landedCost} />
      )}
    </div>
  )
}

function HistoryList({ history }: { history: Array<{ id: string; fromStatusCode: string | null; toStatusCode: string; reason: string | null; changedAt: string }> }) {
  if (!history || history.length === 0) return <p className="text-sm text-muted-foreground">—</p>
  return (
    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
      {history.map((h) => (
        <div key={h.id} className="text-xs border-l-2 border-[#090c1d]/30 pl-3 py-1 space-y-0.5">
          <div className="font-medium text-[#202020]">{h.fromStatusCode ? `${h.fromStatusCode} → ` : ""}{h.toStatusCode}</div>
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

function DrawerTopActions({
  device,
  canEdit,
  onEdit,
  onSell,
}: {
  device: DeviceDetailView
  canEdit: boolean
  onEdit: (d: DeviceView) => void
  onSell: () => void
}) {
  const { t } = useI18n()
  const isInStock = device.statusCode === "IN_STOCK"
  return (
    <div className="flex items-center justify-between gap-2">
      <DeviceStatusBadge status={device.statusCode} />
      <div className="flex items-center gap-2">
        {isInStock && (
          <Button size="sm" onClick={onSell} className="gap-1.5 bg-[#10b981] hover:bg-[#059669] text-white">
            <ShoppingCart className="size-4" />
            {t("inventory.sellInPos")}
          </Button>
        )}
        {canEdit && (
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
  onEdit,
  onClose,
}: {
  device: DeviceDetailView
  canViewCost: boolean
  canChangeStatus: boolean
  canEdit: boolean
  onEdit: (d: DeviceView) => void
  onClose: () => void
}) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { data: history } = useDeviceHistory(device.id)

  const handleSell = () => {
    useCartStore.getState().setDevice(device)
    onClose()
    navigate("/pos")
    toast.success(t("inventory.deviceAddedToCart"))
  }

  return (
    <div className="space-y-5 my-4 overflow-y-auto">
      <DrawerTopActions device={device} canEdit={canEdit} onEdit={onEdit} onSell={handleSell} />
      <DeviceBarcode imei={device.imei} />
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

function DrawerHeaderMeta({
  title,
  imei,
  onCopy,
}: {
  title: string
  imei?: string
  onCopy: () => void
}) {
  const { t } = useI18n()
  return (
    <SheetHeader>
      <SheetTitle className="text-xl font-bold text-[#090c1d]">{title}</SheetTitle>
      <SheetDescription className="flex items-center gap-1.5 font-mono text-xs text-[#646464]">
        <span>IMEI: {imei}</span>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={onCopy}
          title={t("inventory.copyImei")}
          className="size-6 p-0.5 text-[#838383] hover:text-[#090c1d] cursor-pointer"
        >
          <Copy className="size-3" />
        </Button>
      </SheetDescription>
    </SheetHeader>
  )
}

export function DeviceDetailDrawer({
  target,
  open,
  onClose,
  onEdit,
}: {
  target: DeviceTarget | null
  open: boolean
  onClose: () => void
  onEdit: (d: DeviceView) => void
}) {
  const { t } = useI18n()
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const { data: device, isLoading, isError } = useDeviceByImei(target?.imei)

  const handleCopyImei = () => {
    if (!target?.imei) return
    navigator.clipboard.writeText(target.imei)
    toast.success(`${t("inventory.imeiCopied")}: ${target.imei}`)
  }

  const modelTitle = device?.model ? `${device.model.brand} ${device.model.name}` : t("inventory.imeiDetails")

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetPopup className="w-full sm:max-w-2xl lg:max-w-3xl">
        <DrawerHeaderMeta title={modelTitle} imei={target?.imei} onCopy={handleCopyImei} />
        {isLoading && <div className="my-8 text-center text-muted-foreground">{t("common.loading")}</div>}
        {!isLoading && (isError || !device) && target && <NotFoundState />}
        {device && (
          <DrawerBody
            device={device}
            canViewCost={hasPermission("device.cost.view")}
            canChangeStatus={hasPermission("device.status.change")}
            canEdit={hasPermission("device.update")}
            onEdit={onEdit}
            onClose={onClose}
          />
        )}
      </SheetPopup>
    </Sheet>
  )
}
