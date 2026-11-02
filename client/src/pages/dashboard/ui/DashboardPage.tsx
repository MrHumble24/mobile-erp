import { useI18n } from "@/shared/i18n"
import { DashboardMetrics } from "./DashboardMetrics"
import { DashboardLowStockTable } from "./DashboardLowStockTable"
import { DashboardOverdueConsignmentsTable } from "./DashboardOverdueConsignmentsTable"
import { DashboardModelPricingTable } from "./DashboardModelPricingTable"

export function DashboardPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
      </div>

      <DashboardMetrics />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardLowStockTable />
        <DashboardOverdueConsignmentsTable />
      </div>

      <DashboardModelPricingTable />
    </div>
  )
}
