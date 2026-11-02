import { Pencil } from "lucide-react"
import { TableCell, TableRow } from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import { DeviceStatusBadge } from "./DeviceStatusBadge"
import type { DeviceView } from "../model/device.types"

interface DeviceTableRowProps {
  device: DeviceView
  modelName?: string
  canViewCost?: boolean
  canEdit?: boolean
  onSelect?: (device: DeviceView) => void
  onEdit?: (device: DeviceView) => void
}

export function DeviceTableRow({
  device,
  modelName,
  canViewCost,
  canEdit,
  onSelect,
  onEdit,
}: DeviceTableRowProps) {
  const { t } = useI18n()
  const storage = device.specs?.storage ? String(device.specs.storage) : "-"
  const color = device.specs?.color ? String(device.specs.color) : "-"

  return (
    <TableRow className="hover:bg-accent/40 cursor-pointer" onClick={() => onSelect?.(device)}>
      <TableCell className="font-mono font-medium">{device.imei}</TableCell>
      <TableCell className="font-medium">{modelName || device.modelId}</TableCell>
      <TableCell>{storage}</TableCell>
      <TableCell>{color}</TableCell>
      <TableCell>
        <DeviceStatusBadge status={device.statusCode} />
      </TableCell>
      <TableCell className="font-semibold">{formatMoney(device.targetPrice)}</TableCell>
      {canViewCost && (
        <>
          <TableCell className="text-muted-foreground">{formatMoney(device.acquisitionCost)}</TableCell>
          <TableCell className="text-muted-foreground">{formatMoney(device.landedCost)}</TableCell>
        </>
      )}
      <TableCell className="text-muted-foreground text-xs">{formatDate(device.intakeDate)}</TableCell>
      <TableCell className="text-right">
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(device)
            }}
          >
            <Pencil className="size-3.5" />
            {t("common.edit")}
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}
