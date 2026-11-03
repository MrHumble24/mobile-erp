import { useI18n } from "@/shared/i18n"
import { formatDate } from "@/shared/lib/format"
import { DeviceStatusBadge, type DeviceDetailView } from "@/entities/device"

function SpecChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs text-muted-foreground">
      {label}: <span className="font-medium text-[#202020]">{value}</span>
    </span>
  )
}

function PreviousInspection({ device }: { device: DeviceDetailView }) {
  const { t } = useI18n()
  const qc = device.latestInspection
  if (!qc) return <p className="text-xs text-muted-foreground">{t("qc.noPrevious")}</p>
  return (
    <p className="text-xs text-muted-foreground">
      {t("qc.previous")}:{" "}
      <span className={qc.passed ? "text-emerald-600 font-semibold" : "text-destructive font-semibold"}>
        {qc.passed ? t("qc.passed") : t("qc.failed")}
      </span>
      {qc.gradeCode ? ` · ${qc.gradeCode}` : ""}
      {qc.batteryHealth != null ? ` · ${qc.batteryHealth}%` : ""} · {formatDate(qc.inspectedAt)}
    </p>
  )
}

export function DeviceHeaderCard({ device }: { device: DeviceDetailView }) {
  const { t } = useI18n()
  return (
    <div className="space-y-2 border border-[#e8e8e8] rounded-[14px] bg-[#f8f9fa] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-sm font-medium">
          <span>{device.imei}</span>
          {device.imei2 && <span className="block text-xs font-normal text-muted-foreground">IMEI 2: {device.imei2}</span>}
        </div>
        <DeviceStatusBadge status={device.statusCode} />
      </div>
      <p className="text-sm font-semibold">{device.model.brand} {device.model.name}</p>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <SpecChip label={t("inventory.storage")} value={String(device.specs?.storage || "-")} />
        <SpecChip label={t("inventory.color")} value={String(device.specs?.color || "-")} />
        <SpecChip label={t("inventory.ram")} value={String(device.specs?.ram || "-")} />
      </div>
      <PreviousInspection device={device} />
    </div>
  )
}
