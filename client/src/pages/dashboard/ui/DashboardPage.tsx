import { ShoppingCart, DollarSign } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { PageHeader } from "@/shared/ui/page-header"
import { Button } from "@/shared/ui/button"
import { Link } from "@/shared/ui/link"
import { useAuthStore } from "@/features/auth"
import { DashboardMetrics } from "./DashboardMetrics"
import { DashboardLowStockTable } from "./DashboardLowStockTable"
import { DashboardOverdueConsignmentsTable } from "./DashboardOverdueConsignmentsTable"
import { DashboardModelPricingTable } from "./DashboardModelPricingTable"
import { SetupChecklist } from "@/widgets/setup-checklist"

function DashboardActions() {
  const { t } = useI18n()
  const hasPermission = useAuthStore((s) => s.hasPermission)

  return (
    <div className="flex items-center gap-2">
      {hasPermission("expense.read") && (
        <Link to="/expenses" className="no-underline">
          <Button variant="outline" size="sm" className="h-9 px-3.5 rounded-full text-xs font-semibold gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
            <span>{t("nav.expenses")}</span>
          </Button>
        </Link>
      )}
      {hasPermission("sale.create") && (
        <Link to="/pos" className="no-underline">
          <Button size="sm" className="h-9 px-4 rounded-full text-xs font-semibold gap-1.5 shadow-xs">
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{t("nav.pos")}</span>
          </Button>
        </Link>
      )}
    </div>
  )
}

export function DashboardPage() {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.title")}
        description="Do'konning bugungi savdo ko'rsatkichlari, tushumlar va ombor qoldig'i tahlili"
        actions={<DashboardActions />}
      />

      <SetupChecklist />

      <DashboardMetrics />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <DashboardLowStockTable />
        <DashboardOverdueConsignmentsTable />
      </div>

      <DashboardModelPricingTable />
    </div>
  )
}
