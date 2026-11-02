import { TableCell, TableRow } from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { useI18n } from "@/shared/i18n"
import { DeviceStatusBadge } from "./DeviceStatusBadge"
import type { DeviceView } from "../model/device.types"

interface DeviceTableRowProps {
  device: DeviceView
  modelName?: string
  canViewCost?: boolean
  onSelect?: (device: DeviceView) => void
}

export function DeviceTableRow({
  device,
  modelName,
  canViewCost,
  onSelect,
}: DeviceTableRowProps) {
  const { t } = useI18n()
  const storage = device.specs?.storage ? String(device.specs.storage) : "-"
  const color = device.specs?.color ? String(device.specs.color) : ""

  return (
    <TableRow className="hover:bg-accent/40 cursor-pointer" onClick={() => onSelect?.(device)}>
      <TableCell className="font-mono font-medium">{device.imei}</TableCell>
      <TableCell className="font-medium">{modelName || device.modelId}</TableCell>
      <TableCell>
        {storage} {color && <span className="text-muted-foreground text-xs">({color})</span>}
      </TableCell>
      <TableCell>
        <DeviceStatusBadge status={device.statusCode} />
      </TableCell>
      <TableCell className="font-semibold">{device.targetPrice ? `$${device.targetPrice}` : "-"}</TableCell>
      {canViewCost && (
        <>
          <TableCell className="text-muted-foreground">${device.acquisitionCost || "0"}</TableCell>
          <TableCell className="text-muted-foreground">${device.landedCost || "0"}</TableCell>
        </>
      )}
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.(device)
          }}
        >
          {t("common.edit")}
        </Button>
      </TableCell>
    </TableRow>
  )
}
