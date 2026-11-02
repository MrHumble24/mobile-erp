import * as React from "react"
import { useNavigate } from "react-router"
import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import {
  ReportBreakdownSheet,
  type BreakdownRequest,
} from "@/features/report-breakdown"
import { PageHeader } from "@/shared/ui/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { useUrlTab } from "@/shared/lib/hooks/use-url-tab"
import { useReportRange } from "../model/use-report-range"
import { ReportFilterRow } from "./ReportFilterRow"
import { OverviewTab } from "./OverviewTab"
import { SalesTab } from "./SalesTab"
import { ExpensesTab } from "./ExpensesTab"
import { NasiyaTab } from "./NasiyaTab"
import { InventoryTab } from "./InventoryTab"
import { PricingTab } from "./PricingTab"
import { ClosingTab } from "./ClosingTab"

const REPORT_TABS = [
  "overview",
  "sales",
  "expenses",
  "nasiya",
  "inventory",
  "pricing",
  "closing",
] as const
type ReportTab = (typeof REPORT_TABS)[number]

export function ReportsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [tab, setTab] = useUrlTab<ReportTab>("overview", { validTabs: REPORT_TABS })
  const range = useReportRange()
  const [breakdown, setBreakdown] = React.useState<BreakdownRequest | null>(null)
  const canViewCost = useAuthStore(
    (s) => s.user?.permissions?.includes("device.cost.view") ?? false
  )
  const props = { range, onBreakdown: setBreakdown, canViewCost }

  return (
    <div className="space-y-6">
      <PageHeader title={t("reports.title")} description={t("reports.subtitle")} />
      {tab !== "inventory" && tab !== "pricing" && <ReportFilterRow range={range} />}

      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex w-auto">
            {REPORT_TABS.map((value) => (
              <TabsTrigger key={value} value={value}>
                {t(`reports.tab_${value}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="overview" className="mt-5"><OverviewTab {...props} /></TabsContent>
        <TabsContent value="sales" className="mt-5"><SalesTab {...props} /></TabsContent>
        <TabsContent value="expenses" className="mt-5"><ExpensesTab {...props} /></TabsContent>
        <TabsContent value="nasiya" className="mt-5"><NasiyaTab {...props} /></TabsContent>
        <TabsContent value="inventory" className="mt-5"><InventoryTab {...props} /></TabsContent>
        <TabsContent value="pricing" className="mt-5"><PricingTab {...props} /></TabsContent>
        <TabsContent value="closing" className="mt-5"><ClosingTab {...props} /></TabsContent>
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
  )
}
