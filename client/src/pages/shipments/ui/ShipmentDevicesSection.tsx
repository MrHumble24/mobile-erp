import { useNavigate } from "react-router"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { unitCode } from "@/shared/lib/unit-code"
import { DeviceStatusBadge, type DeviceView, type PaginatedDevices } from "@/entities/device"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Pagination } from "@/shared/ui/pagination"

interface SectionProps {
  data?: PaginatedDevices
  isLoading: boolean
  modelsMap: Record<string, string>
  canViewCost: boolean
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

function DeviceRow({
  device,
  modelName,
  canViewCost,
  onOpen,
}: {
  device: DeviceView
  modelName: string
  canViewCost: boolean
  onOpen: () => void
}) {
  return (
    <TableRow className="cursor-pointer" onClick={onOpen}>
      <TableCell className="font-mono text-xs">{unitCode(device)}</TableCell>
      <TableCell className="text-xs">{modelName}</TableCell>
      <TableCell className="text-xs">{String(device.specs?.storage || "-")}</TableCell>
      <TableCell className="text-xs">{String(device.specs?.color || "-")}</TableCell>
      <TableCell><DeviceStatusBadge status={device.statusCode} /></TableCell>
      {canViewCost && <TableCell className="text-xs">{formatMoney(device.acquisitionCost)}</TableCell>}
      {canViewCost && <TableCell className="text-xs font-semibold">{formatMoney(device.landedCost)}</TableCell>}
    </TableRow>
  )
}

function DevicesHead({ canViewCost }: { canViewCost: boolean }) {
  const { t } = useI18n()
  return (
    <TableHeader>
      <TableRow>
        <TableHead>{t("catalog.unitCode")}</TableHead>
        <TableHead>{t("inventory.model")}</TableHead>
        <TableHead>{t("inventory.storage")}</TableHead>
        <TableHead>{t("inventory.color")}</TableHead>
        <TableHead>{t("inventory.status")}</TableHead>
        {canViewCost && <TableHead>{t("inventory.acquisitionCost")}</TableHead>}
        {canViewCost && <TableHead>{t("inventory.landedCost")}</TableHead>}
      </TableRow>
    </TableHeader>
  )
}

export function ShipmentDevicesSection({
  data,
  isLoading,
  modelsMap,
  canViewCost,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: SectionProps) {
  const { t } = useI18n()
  const navigate = useNavigate()

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">{t("common.loading")}</div>
  if (!data || data.total === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground border border-border rounded-[16px] bg-white shadow-[var(--shadow-xs)]">
        {t("shipments.noDevices")}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-[16px] border border-border bg-white overflow-hidden shadow-[var(--shadow-xs)]">
        <Table>
          <DevicesHead canViewCost={canViewCost} />
          <TableBody>
            {data.items.map((d) => (
              <DeviceRow
                key={d.id}
                device={d}
                modelName={modelsMap[d.modelId] || d.modelId}
                canViewCost={canViewCost}
                onOpen={() => navigate(`/inventory?imei=${unitCode(d)}`)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination
        page={page}
        pageSize={pageSize}
        total={data.total}
        rangeLabel={(from, to, total) => t("shipments.pageRange", { from, to, total })}
        perPageLabel={t("shipments.perPage")}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  )
}
