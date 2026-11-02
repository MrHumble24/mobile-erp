import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { useI18n } from "@/shared/i18n"
import { DeviceTableRow } from "./DeviceTableRow"
import type { DeviceView } from "../model/device.types"

interface DeviceTableProps {
  devices: DeviceView[]
  modelsMap?: Record<string, string>
  canViewCost?: boolean
  onSelect?: (device: DeviceView) => void
}

export function DeviceTable({
  devices,
  modelsMap = {},
  canViewCost,
  onSelect,
}: DeviceTableProps) {
  const { t } = useI18n()

  if (devices.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground border rounded-lg bg-card/30">
        {t("inventory.empty")}
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>IMEI</TableHead>
            <TableHead>{t("inventory.model")}</TableHead>
            <TableHead>{t("inventory.storage")}</TableHead>
            <TableHead>{t("inventory.status")}</TableHead>
            <TableHead>{t("inventory.targetPrice")}</TableHead>
            {canViewCost && (
              <>
                <TableHead>{t("inventory.acquisitionCost")}</TableHead>
                <TableHead>{t("inventory.landedCost")}</TableHead>
              </>
            )}
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => (
            <DeviceTableRow
              key={device.id}
              device={device}
              modelName={modelsMap[device.modelId]}
              canViewCost={canViewCost}
              onSelect={onSelect}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
