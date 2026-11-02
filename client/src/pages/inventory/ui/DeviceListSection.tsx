import { useI18n } from "@/shared/i18n"
import { DeviceTable, type DeviceView, type PaginatedDevices } from "@/entities/device"
import { Pagination } from "@/shared/ui/pagination"

interface DeviceListSectionProps {
  data?: PaginatedDevices
  isLoading: boolean
  modelsMap: Record<string, string>
  canViewCost: boolean
  canEdit: boolean
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onSelect: (d: DeviceView) => void
  onEdit: (d: DeviceView) => void
}

export function DeviceListSection({
  data,
  isLoading,
  modelsMap,
  canViewCost,
  canEdit,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSelect,
  onEdit,
}: DeviceListSectionProps) {
  const { t } = useI18n()

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
  }

  return (
    <div className="space-y-4">
      <DeviceTable
        devices={data?.items || []}
        modelsMap={modelsMap}
        canViewCost={canViewCost}
        canEdit={canEdit}
        onSelect={onSelect}
        onEdit={onEdit}
      />
      {data && data.total > 0 && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={data.total}
          rangeLabel={(from, to, total) => t("inventory.pageRange", { from, to, total })}
          perPageLabel={t("inventory.perPage")}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  )
}
