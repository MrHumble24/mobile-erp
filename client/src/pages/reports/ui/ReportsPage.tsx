import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { ProfitReportTab } from "./ProfitReportTab"
import { ExpenseReportTab } from "./ExpenseReportTab"
import { ModelPricingReportTab } from "./ModelPricingReportTab"
import { DailyClosingReportTab } from "./DailyClosingReportTab"

export function ReportsPage() {
  const { t } = useI18n()
  const [tab, setTab] = React.useState("profit")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("reports.title")}</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="profit">{t("reports.tabProfit")}</TabsTrigger>
          <TabsTrigger value="expenses">{t("reports.tabExpenses")}</TabsTrigger>
          <TabsTrigger value="pricing">{t("reports.tabModelPricing")}</TabsTrigger>
          <TabsTrigger value="closing">{t("reports.tabDailyClosing")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profit">
          <ProfitReportTab />
        </TabsContent>

        <TabsContent value="expenses">
          <ExpenseReportTab />
        </TabsContent>

        <TabsContent value="pricing">
          <ModelPricingReportTab />
        </TabsContent>

        <TabsContent value="closing">
          <DailyClosingReportTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
