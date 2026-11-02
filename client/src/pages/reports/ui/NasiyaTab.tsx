import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useConsignmentsReport, type ConsignmentsReport } from "@/entities/report"
import { MetricCard } from "@/shared/ui/metric-card"
import { BreakdownBarChart } from "@/widgets/report-charts"
import type { ReportTabProps } from "../model/tab-props"

function NasiyaTiles({ data }: { data: ConsignmentsReport }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <MetricCard label={t("reports.created")} value={String(data.createdCount)} variant="white" />
      <MetricCard label={t("reports.settled")} value={String(data.settledCount)} variant="white" />
      <MetricCard label={t("reports.returned")} value={String(data.returnedCount)} variant="white" />
      <MetricCard label={t("reports.outstandingTotal")} value={formatMoney(data.outstandingTotal)} variant="dark" />
      <MetricCard label={t("reports.overdueCount")} value={String(data.overdueCount)} variant="white" />
    </div>
  )
}

export function NasiyaTab({ range, onBreakdown }: ReportTabProps) {
  const { t } = useI18n()
  const { from, to } = range
  const { data, isLoading, error } = useConsignmentsReport(from, to)

  const total = data?.outstandingTotal || 1
  const rows = (data?.byPartner ?? []).map((p) => ({
    key: p.partnerId,
    label: p.shopName,
    value: p.outstanding,
    share: p.outstanding / total,
  }))

  return (
    <div className="space-y-6">
      {data && <NasiyaTiles data={data} />}
      <BreakdownBarChart
        title={t("reports.outstandingByPartner")}
        rows={rows}
        labelHeader={t("consignments.partner")}
        valueHeader={t("reports.outstanding")}
        formatValue={formatMoney}
        isLoading={isLoading}
        error={error}
        csvFilename="outstanding-by-partner"
        onSelect={(key) => {
          const row = data?.byPartner.find((p) => p.partnerId === key)
          onBreakdown({ kind: "partner", partnerId: key, shopName: row?.shopName ?? key })
        }}
      />
    </div>
  )
}
