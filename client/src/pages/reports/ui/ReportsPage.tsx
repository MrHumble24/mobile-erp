import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { PageHeader } from "@/shared/ui/page-header"
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
      <PageHeader
        title={t("reports.title")}
        description="Foyda va zararlar, umumiy xarajatlar tahlili, modellarning o'rtacha narxlari va kunlik kassa yopilishi"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-auto inline-flex">
            <TabsTrigger value="profit">{t("reports.tabProfit")}</TabsTrigger>
            <TabsTrigger value="expenses">{t("reports.tabExpenses")}</TabsTrigger>
            <TabsTrigger value="pricing">{t("reports.tabModelPricing")}</TabsTrigger>
            <TabsTrigger value="closing">{t("reports.tabDailyClosing")}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profit" className="mt-5">
          <ProfitReportTab />
        </TabsContent>

        <TabsContent value="expenses" className="mt-5">
          <ExpenseReportTab />
        </TabsContent>

        <TabsContent value="pricing" className="mt-5">
          <ModelPricingReportTab />
        </TabsContent>

        <TabsContent value="closing" className="mt-5">
          <DailyClosingReportTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
