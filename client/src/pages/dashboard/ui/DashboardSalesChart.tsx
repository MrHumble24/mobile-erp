import * as React from "react"
import ReactECharts from "echarts-for-react"
import type { EChartsOption } from "echarts"
import { useI18n } from "@/shared/i18n"
import { formatDate, formatMoney } from "@/shared/lib/format"
import type { TrendPoint } from "@/entities/report"
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"

export interface DashboardSalesChartProps {
  data: TrendPoint[]
  isLoading?: boolean
}

export function DashboardSalesChart({ data, isLoading }: DashboardSalesChartProps) {
  const { t } = useI18n()

  const option = React.useMemo<EChartsOption>(() => {
    const dates = data.map((d) => d.bucket)
    const revenues = data.map((d) => d.revenue)
    const grossProfits = data.map((d) => d.grossProfit)
    const expenses = data.map((d) => d.expenses)

    const labelRev = t("dashboard.revenue")
    const labelGross = t("dashboard.grossProfit")
    const labelExp = t("dashboard.expenses")
    const labelNet = t("dashboard.netOperatingIncome")
    const labelUnits = t("dashboard.unitsSold")

    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(18, 24, 38, 0.96)",
        borderColor: "rgba(255, 255, 255, 0.12)",
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: "#f1f5f9",
          fontSize: 12,
        },
        axisPointer: {
          type: "cross",
          lineStyle: {
            color: "rgba(255, 255, 255, 0.2)",
            type: "dashed",
          },
        },
        formatter: (params: unknown) => {
          const items = Array.isArray(params) ? params : [params]
          if (items.length === 0) return ""
          const first = items[0] as { dataIndex: number }
          const idx = first?.dataIndex ?? 0
          const point = data[idx]
          if (!point) return ""

          const net = point.grossProfit - point.expenses
          const margin = point.revenue > 0 ? (point.grossProfit / point.revenue) * 100 : 0

          return `
            <div style="font-weight: 700; margin-bottom: 8px; font-size: 13px; color: #f8fafc; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px;">
              ${formatDate(point.bucket)}
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; min-width: 210px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 6px; color: #cbd5e1;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span>
                  ${labelRev}:
                </span>
                <span style="font-family: monospace; font-weight: 700; color: #34d399;">${formatMoney(point.revenue)}</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 6px; color: #cbd5e1;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #38bdf8;"></span>
                  ${labelGross}:
                </span>
                <span style="font-family: monospace; font-weight: 700; color: #7dd3fc;">${formatMoney(point.grossProfit)} (${margin.toFixed(1)}%)</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 6px; color: #cbd5e1;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #f43f5e;"></span>
                  ${labelExp}:
                </span>
                <span style="font-family: monospace; font-weight: 600; color: #fda4af;">${formatMoney(point.expenses)}</span>
              </div>
              <div style="margin-top: 4px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between;">
                <span style="color: #94a3b8; font-weight: 600;">${labelNet}:</span>
                <span style="font-family: monospace; font-weight: 700; color: ${net >= 0 ? "#34d399" : "#fb7185"};">${formatMoney(net)}</span>
              </div>
              ${
                point.unitsSold > 0
                  ? `<div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #94a3b8;">
                      <span>${labelUnits}:</span>
                      <span style="font-family: monospace; font-weight: 600; color: #e2e8f0;">${point.unitsSold}</span>
                    </div>`
                  : ""
              }
            </div>
          `
        },
      },
      legend: {
        data: [labelRev, labelGross, labelExp],
        textStyle: {
          color: "#94a3b8",
          fontSize: 12,
        },
        top: 0,
        right: 12,
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 8,
        itemGap: 16,
      },
      grid: {
        left: "2%",
        right: "3%",
        bottom: dates.length > 10 ? "14%" : "6%",
        top: "14%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: dates,
        boundaryGap: false,
        axisLine: {
          lineStyle: { color: "rgba(255, 255, 255, 0.12)" },
        },
        axisLabel: {
          color: "#94a3b8",
          fontSize: 11,
          formatter: (value: string) => {
            const parts = value.split("-")
            return parts.length >= 3 ? `${parts[1]}.${parts[2]}` : value
          },
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        splitLine: {
          lineStyle: {
            color: "rgba(255, 255, 255, 0.06)",
            type: "dashed",
          },
        },
        axisLabel: {
          color: "#64748b",
          fontSize: 11,
          formatter: (value: number) => {
            if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
            if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}k`
            return `$${value}`
          },
        },
      },
      dataZoom: [
        {
          type: "inside",
          start: Math.max(0, 100 - (30 / Math.max(dates.length, 1)) * 100),
          end: 100,
        },
        ...(dates.length > 10
          ? [
              {
                type: "slider" as const,
                bottom: 0,
                height: 18,
                borderColor: "transparent",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                fillerColor: "rgba(16, 185, 129, 0.15)",
                handleStyle: {
                  color: "#10b981",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                },
                moveHandleStyle: {
                  color: "rgba(255, 255, 255, 0.2)",
                },
                textStyle: { color: "#64748b", fontSize: 10 },
                dataBackground: {
                  lineStyle: { color: "#10b981", width: 1 },
                  areaStyle: { color: "rgba(16, 185, 129, 0.1)" },
                },
                selectedDataBackground: {
                  lineStyle: { color: "#10b981" },
                  areaStyle: { color: "rgba(16, 185, 129, 0.2)" },
                },
              },
            ]
          : []),
      ],
      series: [
        {
          name: labelRev,
          type: "line",
          data: revenues,
          smooth: 0.3,
          symbol: "circle",
          symbolSize: 6,
          showSymbol: false,
          itemStyle: { color: "#10b981" },
          lineStyle: { width: 3, color: "#10b981" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(16, 185, 129, 0.25)" },
                { offset: 1, color: "rgba(16, 185, 129, 0.01)" },
              ],
            },
          },
        },
        {
          name: labelGross,
          type: "line",
          data: grossProfits,
          smooth: 0.3,
          symbol: "circle",
          symbolSize: 6,
          showSymbol: false,
          itemStyle: { color: "#38bdf8" },
          lineStyle: { width: 2.5, color: "#38bdf8" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(56, 189, 248, 0.18)" },
                { offset: 1, color: "rgba(56, 189, 248, 0.01)" },
              ],
            },
          },
        },
        {
          name: labelExp,
          type: "line",
          data: expenses,
          smooth: 0.3,
          symbol: "circle",
          symbolSize: 6,
          showSymbol: false,
          itemStyle: { color: "#f43f5e" },
          lineStyle: {
            width: 2,
            color: "#f43f5e",
            type: "dashed",
          },
        },
      ],
    }
  }, [data, t])

  return (
    <Card className="rounded-[20px] p-5 shadow-[var(--shadow-xs)]">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="text-base font-bold">
          {t("dashboard.salesTrendTitle")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("dashboard.salesTrendSubtitle")}
        </CardDescription>
      </CardHeader>

      <div className="h-[280px] w-full sm:h-[320px]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {t("reports.empty")}
          </div>
        ) : (
          <ReactECharts
            option={option}
            style={{ height: "100%", width: "100%" }}
            opts={{ renderer: "svg" }}
            notMerge
          />
        )}
      </div>
    </Card>
  )
}

