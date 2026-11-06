import { PackageSearch, RotateCcw } from "lucide-react"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { Button } from "@/shared/ui/button"
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
  onSell?: (device: DeviceView) => void
  onResetFilters?: () => void
}

function DeviceTableHead({ canViewCost }: { canViewCost?: boolean }) {
  const { t } = useI18n()
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[180px]">{t("catalog.unitCode")}</TableHead>
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

function EmptyState({ onResetFilters }: { onResetFilters?: () => void }) {
  const { t } = useI18n()
  return (
    <div className="py-14 text-center border border-border rounded-[16px] bg-white shadow-[var(--shadow-xs)] space-y-3">
      <PackageSearch className="mx-auto size-10 text-muted-foreground stroke-[1.5]" />
      <div className="space-y-1">
        <p className="font-medium text-sm text-foreground">{t("inventory.empty")}</p>
        <p className="text-xs text-muted-foreground">{t("inventory.searchPlaceholder")}</p>
      </div>
      {onResetFilters && (
        <Button variant="outline" size="sm" onClick={onResetFilters} className="text-xs gap-1.5 mt-1">
          <RotateCcw className="size-3.5" />
          {t("inventory.clearFilters")}
        </Button>
      )}
    </div>
  )
}

export function DeviceTable({
  devices,
  modelsMap = {},
  canViewCost,
  canEdit,
  onSelect,
  onEdit,
  onSell,
  onResetFilters,
}: DeviceTableProps) {
  if (devices.length === 0) {
    return <EmptyState onResetFilters={onResetFilters} />
  }

  return (
    <div className="rounded-[16px] border border-border bg-white overflow-hidden shadow-[var(--shadow-xs)]">
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
              onSell={onSell}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
