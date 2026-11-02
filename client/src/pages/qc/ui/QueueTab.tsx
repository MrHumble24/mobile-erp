import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useDeviceModels } from "@/entities/device-model"
import type { DeviceView } from "@/entities/device"
import { DeviceDrawer } from "@/widgets/device-drawer"
import { Pagination } from "@/shared/ui/pagination"
import { QueueFilters } from "./QueueFilters"
import { QueueTable } from "./QueueTable"
import { useQcQueue } from "../model/use-qc-queue"

export function QueueTab({ onInspect }: { onInspect: (imei: string) => void }) {
  const { t } = useI18n()
  const { filters, pagination, query } = useQcQueue()
  const { data: models } = useDeviceModels()
  const [drawerImei, setDrawerImei] = React.useState<string | null>(null)

  const modelsMap = React.useMemo(
    () => (models || []).reduce<Record<string, string>>((acc, m) => {
      acc[m.id] = `${m.brand} ${m.name}`
      return acc
    }, {}),
    [models]
  )

  const data = query.data

  return (
    <div className="space-y-5">
      <QueueFilters filters={filters} models={models || []} />
      {query.isLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
      ) : (
        <QueueTable
          devices={data?.items || []}
          modelsMap={modelsMap}
          onInspect={(d: DeviceView) => onInspect(d.imei)}
          onSelect={(d: DeviceView) => setDrawerImei(d.imei)}
        />
      )}
      {data && data.total > 0 && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={data.total}
          rangeLabel={(from, to, total) => t("inventory.pageRange", { from, to, total })}
          perPageLabel={t("inventory.perPage")}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      )}
      <DeviceDrawer
        imei={drawerImei}
        open={Boolean(drawerImei)}
        onClose={() => setDrawerImei(null)}
        onInspect={(d) => { setDrawerImei(null); onInspect(d.imei) }}
      />
    </div>
  )
}
