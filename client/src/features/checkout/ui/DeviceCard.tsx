import { Smartphone, CheckCircle, Battery } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
import { Card, CardContent } from "@/shared/ui/card"
import { DeviceStatusBadge, type DeviceDetailView } from "@/entities/device"

export function DeviceCard({ device }: { device: DeviceDetailView }) {
  const { t } = useI18n()
  const storage = device.specs?.storage ? String(device.specs.storage) : "-"
  const color = device.specs?.color ? String(device.specs.color) : ""
  const qc = device.latestInspection

  return (
    <Card className="border border-border bg-card shadow-[var(--shadow-xs)]">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {device.model?.brand} {device.model?.name}
              </h3>
              <p className="font-mono text-xs text-muted-foreground">{unitCode(device)}</p>
              {device.imei2 && (
                <p className="font-mono text-[10px] text-muted-foreground">IMEI 2: {device.imei2}</p>
              )}
            </div>
          </div>
          <DeviceStatusBadge status={device.statusCode} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs border-t border-border pt-2">
          <div>
            <span className="text-muted-foreground">{t("inventory.storage")}:</span>{" "}
            <span className="font-medium">{storage} {color && `(${color})`}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("inventory.targetPrice")}:</span>{" "}
            <span className="font-semibold text-primary">{formatMoney(device.targetPrice)}</span>
          </div>
        </div>

        {qc && (
          <div className="flex items-center gap-3 text-xs bg-muted border border-border rounded-[10px] p-2 text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Grade: <strong className="text-foreground">{qc.gradeCode || "OK"}</strong></span>
            </div>
            {qc.batteryHealth != null && (
              <div className="flex items-center gap-1">
                <Battery className="w-3.5 h-3.5 text-primary" />
                <span><strong className="text-foreground">{qc.batteryHealth}%</strong></span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
