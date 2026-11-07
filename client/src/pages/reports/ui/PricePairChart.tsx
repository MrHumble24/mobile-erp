import * as React from "react"
import ReactECharts from "echarts-for-react"
import type { EChartsOption } from "echarts"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"

export interface PricePairDatum {
  model: string
  landed: number
  selling: number
}

export function PricePairChart({ data }: { data: PricePairDatum[] }) {
  const { t } = useI18n()

  const option = React.useMemo<EChartsOption>(() => {
    const models = data.map((d) => d.model)
    const landedValues = data.map((d) => d.landed)
    const sellingValues = data.map((d) => d.selling)

    const labelLanded = t("dashboard.avgLandedCost")
    const labelSelling = t("dashboard.avgSellingPrice")

    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(18, 24, 38, 0.96)",
        borderColor: "rgba(255, 255, 255, 0.12)",
        borderWidth: 1,
        padding: [12, 16],
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        axisPointer: {
          type: "shadow",
          shadowStyle: { color: "rgba(255, 255, 255, 0.04)" },
        },
        formatter: (params: unknown) => {
          const items = Array.isArray(params) ? params : [params]
          if (items.length === 0) return ""
          const first = items[0] as { dataIndex: number }
          const idx = first?.dataIndex ?? 0
          const item = data[idx]
          if (!item) return ""

          const profit = item.selling - item.landed
          const margin = item.landed > 0 ? (profit / item.landed) * 100 : 0

          return `
            <div style="font-weight: 700; margin-bottom: 8px; font-size: 13px; color: #f8fafc; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px;">
              ${item.model}
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; min-width: 200px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 6px; color: #cbd5e1;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #818cf8;"></span>
                  ${labelLanded}:
                </span>
                <span style="font-family: monospace; font-weight: 600; color: #c7d2fe;">${formatMoney(item.landed)}</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="display: flex; align-items: center; gap: 6px; color: #cbd5e1;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981;"></span>
                  ${labelSelling}:
                </span>
                <span style="font-family: monospace; font-weight: 700; color: #34d399;">${formatMoney(item.selling)}</span>
              </div>
              <div style="margin-top: 4px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: space-between;">
                <span style="color: #94a3b8; font-weight: 600;">${t("reports.margin")}:</span>
                <span style="font-family: monospace; font-weight: 700; color: ${profit >= 0 ? "#34d399" : "#fb7185"};">
                  ${formatMoney(profit)} (${margin.toFixed(1)}%)
                </span>
              </div>
            </div>
          `
        },
      },
      legend: {
        data: [labelLanded, labelSelling],
        textStyle: { color: "#94a3b8", fontSize: 12 },
        top: 0,
        right: 12,
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 8,
        itemGap: 16,
      },
      grid: {
        left: "3%",
        right: "3%",
        bottom: "16%",
        top: "14%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: models,
        axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.12)" } },
        axisLabel: {
          color: "#94a3b8",
          fontSize: 11,
          rotate: models.length > 5 ? 25 : 0,
          interval: 0,
          formatter: (val: string) => {
            return val.length > 18 ? `${val.slice(0, 16)}...` : val
          },
        },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        splitLine: {
          lineStyle: { color: "rgba(255, 255, 255, 0.06)", type: "dashed" },
        },
        axisLabel: {
          color: "#64748b",
          fontSize: 11,
          formatter: (value: number) => {
            if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}k`
            return `$${value}`
          },
        },
      },
      series: [
        {
          name: labelLanded,
          type: "bar",
          data: landedValues,
          barMaxWidth: 20,
          itemStyle: {
            color: "#6366f1", // indigo-500
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: labelSelling,
          type: "bar",
          data: sellingValues,
          barMaxWidth: 20,
          itemStyle: {
            color: "#10b981", // emerald-500
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    }
  }, [data, t])

  return (
    <div className="h-[340px] w-full p-2">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "svg" }}
        notMerge
      />
    </div>
  )
}
