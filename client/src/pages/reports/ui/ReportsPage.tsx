import * as React from "react"
import { useNavigate } from "react-router"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { ReportAllStoresProvider } from "@/entities/report"
import { Switch } from "@/shared/ui/switch"
import { Label } from "@/shared/ui/label"
import {
  ReportBreakdownSheet,
  type BreakdownRequest,
} from "@/features/report-breakdown"
import { PageHeader } from "@/shared/ui/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { useUrlTab } from "@/shared/lib/hooks/use-url-tab"
import { useReportRange } from "../model/use-report-range"
import { useReportTabs, type ReportTab } from "../model/use-report-tabs"
import { ReportFilterRow } from "./ReportFilterRow"
import { OverviewTab } from "./OverviewTab"
import { SalesTab } from "./SalesTab"
import { ExpensesTab } from "./ExpensesTab"
import { NasiyaTab } from "./NasiyaTab"
import { CreditReportTab } from "./CreditReportTab"
import { InventoryTab } from "./InventoryTab"
import { PricingTab } from "./PricingTab"
import { ClosingTab } from "./ClosingTab"
import { CustomsFeesTab } from "./CustomsFeesTab"
import { RepairsReportTab } from "./RepairsReportTab"

export function ReportsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const canSeeAll = useAuthStore((s) => s.hasPermission("store.all"))
  const [allStores, setAllStores] = React.useState(false)

  const handleAllStoresChange = (checked: boolean) => {
    setAllStores(checked)
  }

  const { tabs, canViewCost, canReadCustoms, repairsOn } = useReportTabs()
  const [tab, setTab] = useUrlTab<ReportTab>("overview", { validTabs: tabs })
  const range = useReportRange()
  const [breakdown, setBreakdown] = React.useState<BreakdownRequest | null>(null)
  const props = { range, onBreakdown: setBreakdown, canViewCost }

  return (
    <ReportAllStoresProvider allStores={allStores}>
      <div className="space-y-6">
        <PageHeader
          title={t("reports.title")}
          description={t("reports.subtitle")}
          actions={
            canSeeAll ? (
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs">
                <Switch
                  id="all-stores-reports"
                  checked={allStores}
                  onCheckedChange={handleAllStoresChange}
                />
                <Label htmlFor="all-stores-reports" className="cursor-pointer text-xs font-medium">
                  {t("reports.allStores")}
                </Label>
              </div>
            ) : undefined
          }
        />
        {tab !== "inventory" && tab !== "pricing" && tab !== "customs" && tab !== "credit" && (
          <ReportFilterRow range={range} />
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <div className="overflow-x-auto pb-1">
            <TabsList className="inline-flex w-auto">
              {tabs.map((value) => (
                <TabsTrigger key={value} value={value}>
                  {value === "customs"
                    ? t("reports.customsTab")
                    : value === "repairs"
                      ? t("repairs.reportTab")
                      : t(`reports.tab_${value}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabsContent value="overview" className="mt-5"><OverviewTab {...props} /></TabsContent>
          <TabsContent value="sales" className="mt-5"><SalesTab {...props} /></TabsContent>
          <TabsContent value="expenses" className="mt-5"><ExpensesTab {...props} /></TabsContent>
          <TabsContent value="nasiya" className="mt-5"><NasiyaTab {...props} /></TabsContent>
          <TabsContent value="credit" className="mt-5"><CreditReportTab /></TabsContent>
          <TabsContent value="inventory" className="mt-5"><InventoryTab {...props} /></TabsContent>
          <TabsContent value="pricing" className="mt-5"><PricingTab {...props} /></TabsContent>
          <TabsContent value="closing" className="mt-5"><ClosingTab {...props} /></TabsContent>
          {canReadCustoms && <TabsContent value="customs" className="mt-5"><CustomsFeesTab /></TabsContent>}
          {repairsOn && <TabsContent value="repairs" className="mt-5"><RepairsReportTab range={range} /></TabsContent>}
        </Tabs>

        <ReportBreakdownSheet
          request={breakdown}
          onOpenChange={(open) => !open && setBreakdown(null)}
          onOpen={setBreakdown}
          onNavigate={(path) => {
            setBreakdown(null)
            navigate(path)
          }}
          canViewCost={canViewCost}
        />
      </div>
    </ReportAllStoresProvider>
  )
}
