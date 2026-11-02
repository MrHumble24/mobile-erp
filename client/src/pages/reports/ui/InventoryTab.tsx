import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useInventoryReport, type InventoryReport } from "@/entities/report"
import { MetricCard } from "@/shared/ui/metric-card"
import { BreakdownBarChart, SEQUENTIAL_VARS } from "@/widgets/report-charts"
import type { ReportTabProps } from "../model/tab-props"

function InventoryTiles({ data, canViewCost }: { data: InventoryReport; canViewCost: boolean }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard label={t("dashboard.unitsInStock")} value={String(data.inStockUnits)} variant="white" />
      {canViewCost && (
        <MetricCard label={t("reports.landedValue")} value={formatMoney(data.inStockLandedValue)} variant="dark" />
      )}
      <MetricCard label={t("reports.defective")} value={String(data.defectiveUnits)} variant="white" />
      <MetricCard label={t("reports.consigned")} value={String(data.consignedUnits)} variant="white" />
    </div>
  )
}

function inventorySeries(data: InventoryReport | undefined, daysShort: string) {
  const share = <T,>(rows: T[], v: (r: T) => number) => {
    const total = rows.reduce((s, r) => s + v(r), 0) || 1
    return (r: T) => v(r) / total
  }
  const statuses = data?.byStatus ?? []
  const statusShare = share(statuses, (r) => r.count)
  const models = data?.byModel ?? []
  const modelShare = share(models, (r) => r.units)
  const aging = data?.aging ?? []
  const agingShare = share(aging, (r) => r.units)
  return {
    statusRows: statuses.map((r) => ({ key: r.statusCode, label: r.label, value: r.count, share: statusShare(r) })),
    modelRows: models.map((r) => ({ key: r.modelId, label: `${r.label} · ${Math.round(r.avgDaysInStock)}${daysShort}`, value: r.units, share: modelShare(r) })),
    agingRows: aging.map((r) => ({ key: r.bucket, label: r.bucket, value: r.units, share: agingShare(r) })),
  }
}

export function InventoryTab({ onBreakdown, canViewCost }: ReportTabProps) {
  const { t } = useI18n()
  const { data, isLoading, error } = useInventoryReport()
  const { statusRows, modelRows, agingRows } = inventorySeries(data, t("reports.daysShort"))

  return (
    <div className="space-y-6">
      {data && <InventoryTiles data={data} canViewCost={canViewCost} />}
      <BreakdownBarChart
        title={t("reports.byStatus")}
        rows={statusRows}
        labelHeader={t("common.status")}
        valueHeader={t("reports.units")}
        formatValue={(v) => String(v)}
        isLoading={isLoading}
        error={error}
        csvFilename="inventory-by-status"
      />
      <BreakdownBarChart
        title={t("reports.byModel")}
        rows={modelRows}
        labelHeader={t("inventory.model")}
        valueHeader={t("reports.units")}
        formatValue={(v) => String(v)}
        isLoading={isLoading}
        error={error}
        csvFilename="inventory-by-model"
        onSelect={(key) => {
          const row = data?.byModel.find((m) => m.modelId === key)
          onBreakdown({ kind: "inventoryModel", modelId: key, label: row?.label ?? key })
        }}
      />
      <BreakdownBarChart
        title={t("reports.aging")}
        rows={agingRows}
        labelHeader={t("reports.ageBucket")}
        valueHeader={t("reports.units")}
        formatValue={(v) => String(v)}
        isLoading={isLoading}
        error={error}
        csvFilename="inventory-aging"
        colors={SEQUENTIAL_VARS}
      />
    </div>
  )
}
