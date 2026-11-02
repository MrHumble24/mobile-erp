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
  canEdit?: boolean
  onSelect?: (device: DeviceView) => void
  onEdit?: (device: DeviceView) => void
}

function DeviceTableHead({ canViewCost }: { canViewCost?: boolean }) {
  const { t } = useI18n()
  return (
    <TableHeader>
      <TableRow>
        <TableHead>IMEI</TableHead>
        <TableHead>{t("inventory.model")}</TableHead>
        <TableHead>{t("inventory.storage")}</TableHead>
        <TableHead>{t("inventory.color")}</TableHead>
        <TableHead>{t("inventory.status")}</TableHead>
        <TableHead>{t("inventory.targetPrice")}</TableHead>
        {canViewCost && (
          <>
            <TableHead>{t("inventory.acquisitionCost")}</TableHead>
            <TableHead>{t("inventory.landedCost")}</TableHead>
          </>
        )}
        <TableHead>{t("inventory.intakeDate")}</TableHead>
        <TableHead className="text-right">{t("common.actions")}</TableHead>
      </TableRow>
    </TableHeader>
  )
}

export function DeviceTable({
  devices,
  modelsMap = {},
  canViewCost,
  canEdit,
  onSelect,
  onEdit,
}: DeviceTableProps) {
  const { t } = useI18n()

  if (devices.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground border border-[#e8e8e8] rounded-[16px] bg-white shadow-[var(--shadow-xs)]">
        {t("inventory.empty")}
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-[#e8e8e8] bg-white overflow-hidden shadow-[var(--shadow-xs)]">
      <Table>
        <DeviceTableHead canViewCost={canViewCost} />
        <TableBody>
          {devices.map((device) => (
            <DeviceTableRow
              key={device.id}
              device={device}
              modelName={modelsMap[device.modelId]}
              canViewCost={canViewCost}
              canEdit={canEdit}
              onSelect={onSelect}
              onEdit={onEdit}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
