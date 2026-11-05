import { Copy, Pencil, ShoppingCart } from "lucide-react"
import { TableCell, TableRow } from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
import { toast } from "@/shared/ui/sonner"
import { useI18n } from "@/shared/i18n"
import { formatMoney, formatDate } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
import { DeviceStatusBadge } from "./DeviceStatusBadge"
import type { DeviceView } from "../model/device.types"

interface DeviceTableRowProps {
  device: DeviceView
  modelName?: string
  canViewCost?: boolean
  canEdit?: boolean
  onSelect?: (device: DeviceView) => void
  onEdit?: (device: DeviceView) => void
  onSell?: (device: DeviceView) => void
}

function UnitCodeCell({ code, imei2 }: { code: string; imei2: string | null }) {
  const { t } = useI18n()
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    toast.success(`${t("inventory.imeiCopied")}: ${code}`)
  }

  return (
    <div className="font-mono text-xs font-semibold text-[#090c1d]">
      <div className="flex items-center gap-1.5">
        <span>{code}</span>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={handleCopy}
          title={t("inventory.copyImei")}
          className="size-5 p-0.5 opacity-50 hover:opacity-100 hover:text-[#090c1d] cursor-pointer"
        >
          <Copy className="size-3" />
        </Button>
      </div>
      {imei2 && <div className="text-[10px] font-normal text-[#838383]">IMEI 2: {imei2}</div>}
    </div>
  )
}

function ActionButtons({
  device,
  canEdit,
  onEdit,
  onSell,
}: {
  device: DeviceView
  canEdit?: boolean
  onEdit?: (d: DeviceView) => void
  onSell?: (d: DeviceView) => void
}) {
  const { t } = useI18n()
  const isInStock = device.statusCode === "IN_STOCK"
  return (
    <div className="flex items-center justify-end gap-1">
      {isInStock && onSell && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs px-2 gap-1 text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/10 hover:text-[#10b981]"
          onClick={(e) => {
            e.stopPropagation()
            onSell(device)
          }}
          title={t("inventory.sellInPos")}
        >
          <ShoppingCart className="size-3" />
          <span className="hidden xl:inline">{t("inventory.sellInPos")}</span>
        </Button>
      )}
      {canEdit && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2 gap-1"
          onClick={(e) => {
            e.stopPropagation()
            onEdit?.(device)
          }}
        >
          <Pencil className="size-3" />
          <span className="hidden sm:inline">{t("common.edit")}</span>
        </Button>
      )}
    </div>
  )
}

export function DeviceTableRow({
  device,
  modelName,
  canViewCost,
  canEdit,
  onSelect,
  onEdit,
  onSell,
}: DeviceTableRowProps) {
  const storage = device.specs?.storage ? String(device.specs.storage) : "-"
  const color = device.specs?.color ? String(device.specs.color) : "-"

  return (
    <TableRow className="hover:bg-[#f8f9fa] cursor-pointer transition-colors" onClick={() => onSelect?.(device)}>
      <TableCell>
        <UnitCodeCell code={unitCode(device)} imei2={device.imei2} />
      </TableCell>
      <TableCell className="font-medium text-[#202020]">{modelName || device.modelId}</TableCell>
      <TableCell className="text-xs text-[#646464]">{storage}</TableCell>
      <TableCell className="text-xs text-[#646464]">{color}</TableCell>
      <TableCell>
        <DeviceStatusBadge status={device.statusCode} />
      </TableCell>
      <TableCell className="font-semibold text-[#090c1d]">{formatMoney(device.targetPrice)}</TableCell>
      {canViewCost && (
        <>
          <TableCell className="text-xs text-[#646464]">{formatMoney(device.acquisitionCost)}</TableCell>
          <TableCell className="text-xs font-medium text-[#090c1d]">{formatMoney(device.landedCost)}</TableCell>
        </>
      )}
      <TableCell className="text-xs text-[#838383]">{formatDate(device.intakeDate)}</TableCell>
      <TableCell className="text-right">
        <ActionButtons device={device} canEdit={canEdit} onEdit={onEdit} onSell={onSell} />
      </TableCell>
    </TableRow>
  )
}
