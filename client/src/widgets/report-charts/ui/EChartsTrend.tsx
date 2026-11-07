import * as React from "react"
import ReactECharts from "echarts-for-react"
import { useI18n } from "@/shared/i18n"
import type { TrendPoint } from "@/entities/report"
import { buildTrendOption } from "../lib/build-trend-option"

export function EChartsTrend({ data }: { data: TrendPoint[] }) {
  const { t } = useI18n()

  const option = React.useMemo(
    () =>
      buildTrendOption(data, {
        revenue: t("dashboard.revenue"),
        grossProfit: t("dashboard.grossProfit"),
        expenses: t("dashboard.expenses"),
        net: t("dashboard.netOperatingIncome"),
        units: t("dashboard.unitsSold"),
      }),
    [data, t]
  )

  return (
    <div className="h-[320px] w-full sm:h-[360px]">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "svg" }}
        notMerge
      />
    </div>
  )
}
