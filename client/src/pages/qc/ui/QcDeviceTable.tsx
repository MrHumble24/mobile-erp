import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { useI18n } from "@/shared/i18n"
import { DeviceStatusBadge, type DeviceView } from "@/entities/device"

export function QcDeviceTable({
  devices,
  modelsMap,
  onInspect,
}: {
  devices: DeviceView[]
  modelsMap: Record<string, string>
  onInspect: (device: DeviceView) => void
}) {
  const { t } = useI18n()

  if (devices.length === 0) {
    return <div className="py-12 text-center text-muted-foreground border border-[#e8e8e8] rounded-[16px] bg-white shadow-[var(--shadow-xs)]">{t("common.notFound")}</div>
  }

  return (
    <div className="rounded-[16px] border border-[#e8e8e8] bg-white overflow-hidden shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>IMEI</TableHead>
            <TableHead>{t("inventory.model")}</TableHead>
            <TableHead>{t("inventory.storage")}</TableHead>
            <TableHead>{t("inventory.status")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => (
            <TableRow key={device.id}>
              <TableCell className="font-mono font-medium">{device.imei}</TableCell>
              <TableCell className="font-medium">{modelsMap[device.modelId] || device.modelId}</TableCell>
              <TableCell>{String(device.specs?.storage || "-")}</TableCell>
              <TableCell><DeviceStatusBadge status={device.statusCode} /></TableCell>
              <TableCell className="text-right">
                <Button size="sm" onClick={() => onInspect(device)}>
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
