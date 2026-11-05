import { useI18n } from "@/shared/i18n"
import { formatDate } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
import { DeviceStatusBadge, type DeviceView, type QcInspectionSummary } from "@/entities/device"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"

function LastInspectionCell({ qc }: { qc: QcInspectionSummary | null | undefined }) {
  const { t } = useI18n()
  if (!qc) return <span className="text-xs text-muted-foreground">{t("qc.never")}</span>
  return (
    <span className="text-xs">
      <span className={qc.passed ? "text-emerald-600 font-semibold" : "text-destructive font-semibold"}>
        {qc.passed ? t("qc.passed") : t("qc.failed")}
      </span>
      {qc.gradeCode ? ` · ${qc.gradeCode}` : ""} · {formatDate(qc.inspectedAt)}
    </span>
  )
}

function QueueHead() {
  const { t } = useI18n()
  return (
    <TableHeader>
      <TableRow>
        <TableHead>{t("catalog.unitCode")}</TableHead>
        <TableHead>{t("inventory.model")}</TableHead>
        <TableHead>{t("inventory.storage")}</TableHead>
        <TableHead>{t("inventory.status")}</TableHead>
        <TableHead>{t("qc.lastInspection")}</TableHead>
        <TableHead>{t("inventory.intakeDate")}</TableHead>
        <TableHead className="text-right">{t("common.actions")}</TableHead>
      </TableRow>
    </TableHeader>
  )
}

export function QueueTable({
  devices,
  modelsMap,
  onInspect,
  onSelect,
}: {
  devices: DeviceView[]
  modelsMap: Record<string, string>
  onInspect: (device: DeviceView) => void
  onSelect: (device: DeviceView) => void
}) {
  const { t } = useI18n()
  if (devices.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground border border-[#e8e8e8] rounded-[16px] bg-white shadow-[var(--shadow-xs)]">
        {t("qc.queueEmpty")}
      </div>
    )
  }
  return (
    <div className="rounded-[16px] border border-[#e8e8e8] bg-white overflow-hidden shadow-[var(--shadow-xs)]">
      <Table>
        <QueueHead />
        <TableBody>
          {devices.map((device) => (
            <TableRow key={device.id} className="hover:bg-accent/40 cursor-pointer" onClick={() => onSelect(device)}>
              <TableCell className="font-mono font-medium">{unitCode(device)}</TableCell>
              <TableCell className="font-medium">{modelsMap[device.modelId] || device.modelId}</TableCell>
              <TableCell>{String(device.specs?.storage || "-")}</TableCell>
              <TableCell><DeviceStatusBadge status={device.statusCode} /></TableCell>
              <TableCell><LastInspectionCell qc={device.latestInspection} /></TableCell>
              <TableCell className="text-muted-foreground text-xs">{formatDate(device.intakeDate)}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" onClick={(e) => { e.stopPropagation(); onInspect(device) }}>
                  {t("qc.runInspection")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
