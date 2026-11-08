import { Smartphone, CheckCircle, Battery, Trash2 } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
import { Button } from "@/shared/ui/button"
import { DeviceStatusBadge, type DeviceDetailView } from "@/entities/device"
import { cn } from "@/shared/lib/utils"

export interface DeviceCardProps {
  device: DeviceDetailView
  onRemove?: () => void
  removeLabel?: string
  className?: string
}

export function DeviceCard({ device, onRemove, removeLabel, className }: DeviceCardProps) {
  const { t } = useI18n()
  const storage = device.specs?.storage ? String(device.specs.storage) : "-"
  const color = device.specs?.color ? String(device.specs.color) : ""
  const qc = device.latestInspection

  return (
    <div className={cn("rounded-[12px] bg-muted/40 p-3 border border-border/70 space-y-2.5", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-[10px] bg-primary/10 text-primary shrink-0">
            <Smartphone className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-tight text-foreground truncate">
              {device.model?.brand} {device.model?.name}
            </h3>
            <p className="font-mono text-xs text-muted-foreground truncate">{unitCode(device)}</p>
            {device.imei2 && (
              <p className="font-mono text-[10px] text-muted-foreground truncate">IMEI 2: {device.imei2}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <DeviceStatusBadge status={device.statusCode} />
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md shrink-0"
              onClick={onRemove}
              aria-label={removeLabel || t("pos.removeLine")}
              title={removeLabel || t("pos.removeLine")}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs border-t border-border/50 pt-2 text-muted-foreground">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="shrink-0">{t("inventory.storage")}:</span>
          <span className="font-semibold text-foreground">{storage}</span>
          {color && <span className="font-medium text-foreground">({color})</span>}
        </div>
        <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
          <span className="shrink-0">{t("inventory.targetPrice")}:</span>
          <span className="font-semibold text-primary tabular-nums">{formatMoney(device.targetPrice)}</span>
        </div>
      </div>

      {qc && (
        <div className="flex items-center gap-3 text-xs bg-card border border-border/60 rounded-[8px] px-2.5 py-1.5 text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle className="size-3.5 text-emerald-600" />
            <span>Grade: <strong className="text-foreground">{qc.gradeCode || "OK"}</strong></span>
          </div>
          {qc.batteryHealth != null && (
            <div className="flex items-center gap-1">
              <Battery className="size-3.5 text-primary" />
              <span><strong className="text-foreground">{qc.batteryHealth}%</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
