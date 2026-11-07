import { ShoppingCart, DollarSign, Store, PackagePlus } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Link } from "@/shared/ui/link"
import { useAuthStore } from "@/features/auth"
import { SetupChecklist } from "@/widgets/setup-checklist"
import { DashboardOperationalPulse } from "./DashboardOperationalPulse"
import { DashboardMetrics } from "./DashboardMetrics"
import { DashboardLowStockTable } from "./DashboardLowStockTable"
import { DashboardOverdueConsignmentsTable } from "./DashboardOverdueConsignmentsTable"
import { DashboardModelPricingTable } from "./DashboardModelPricingTable"

function DashboardActions() {
  const { t } = useI18n()
  const hasPermission = useAuthStore((s) => s.hasPermission)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Storefront Link */}
      <Link to="/shop" className="no-underline">
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3.5 rounded-full text-xs font-semibold gap-1.5 border-border/80 hover:border-primary/50 cursor-pointer"
        >
          <Store className="size-3.5 text-primary" />
          <span>{t("dashboard.actionShop")}</span>
        </Button>
      </Link>

      {/* Expense Action */}
      {hasPermission("expense.read") && (
        <Link to="/expenses" className="no-underline">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3.5 rounded-full text-xs font-semibold gap-1.5 border-border/80 hover:border-rose-500/50 cursor-pointer"
          >
            <DollarSign className="size-3.5 text-rose-400" />
            <span>{t("dashboard.actionExpense")}</span>
          </Button>
        </Link>
      )}

      {/* New Shipment Intake */}
      {hasPermission("shipment.create") && (
        <Link to="/shipments" className="no-underline">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-3.5 rounded-full text-xs font-semibold gap-1.5 border-border/80 hover:border-sky-500/50 cursor-pointer"
          >
            <PackagePlus className="size-3.5 text-sky-400" />
            <span>{t("dashboard.actionShipment")}</span>
          </Button>
        </Link>
      )}

      {/* POS Checkout */}
      {hasPermission("sale.create") && (
        <Link to="/pos" className="no-underline">
          <Button
            size="sm"
            className="h-9 px-4 rounded-full text-xs font-bold gap-1.5 shadow-xs cursor-pointer hover:scale-102 transition-transform"
          >
            <ShoppingCart className="size-3.5" />
            <span>{t("dashboard.actionPos")}</span>
          </Button>
        </Link>
      )}
    </div>
  )
}

export function DashboardPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header with Action Pills */}
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.subtitle")}
        actions={<DashboardActions />}
      />

      {/* Setup Checklist if incomplete */}
      <SetupChecklist />

      {/* 1. Operational Pulse Bar (Shift, Orders, Low Stock, Overdue) */}
      <DashboardOperationalPulse />

      {/* 2. Hero KPI Metrics + Apache ECharts Live Sales & Profit Timeline */}
      <DashboardMetrics />

      {/* 3. Operational Grid (Low Stock Alerts + Overdue Consignments) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <DashboardLowStockTable />
        <DashboardOverdueConsignmentsTable />
      </div>

      {/* 4. Top Selling Models Profitability Table */}
      <DashboardModelPricingTable />
    </div>
  )
}

export default DashboardPage
