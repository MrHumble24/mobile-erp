import * as React from "react"
import ReactECharts from "echarts-for-react"
import type { EChartsOption } from "echarts"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import type { LedgerTimelinePoint } from "@/entities/ledger"

interface Props {
  data: LedgerTimelinePoint[]
  isLoading?: boolean
}

export function CashFlowTimelineChart({ data, isLoading }: Props) {
  const { t } = useI18n()

  const option = React.useMemo<EChartsOption>(() => {
    const dates = data.map((d) => d.date)
    const inflows = data.map((d) => d.inflow)
    const outflows = data.map((d) => d.outflow)
    const nets = data.map((d) => d.net)

    const labelIn = t("balance.colIn")
    const labelOut = t("balance.colOut")
    const labelNet = t("balance.netFlow")

    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(18, 24, 38, 0.95)",
        borderColor: "rgba(255, 255, 255, 0.12)",
        borderWidth: 1,
        padding: [12, 16],
        textStyle: {
          color: "#f1f5f9",
          fontSize: 12,
        },
        axisPointer: {
          type: "shadow",
          shadowStyle: {
            color: "rgba(255, 255, 255, 0.04)",
          },
        },
        // Custom explicit tooltip
        formatter: (params: unknown) => {
          const items = Array.isArray(params) ? params : [params]
          if (items.length === 0) return ""
          const first = items[0] as { name?: string }
          const title = first?.name ?? ""

          let html = `<div style="font-weight: 600; margin-bottom: 8px; font-size: 13px; color: #f8fafc;">${title}</div>`
          items.forEach((item: unknown) => {
            const series = item as {
              seriesName?: string
              value?: number
              color?: string
            }
            const val = series.value ?? 0
            const col = series.color ?? "#fff"
            html += `
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 20px; font-size: 12px; margin-top: 4px;">
                <span style="display: flex; align-items: center; gap: 6px; color: #cbd5e1;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${col};"></span>
                  ${series.seriesName}
                </span>
                <span style="font-family: monospace; font-weight: 700; color: #fff;">${formatMoney(val)}</span>
              </div>
            `
          })
          return html
        },
      },
      legend: {
        data: [labelIn, labelOut, labelNet],
        textStyle: {
          color: "#94a3b8",
          fontSize: 12,
        },
        top: 0,
        right: 10,
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
        data: dates,
        axisLine: {
          lineStyle: { color: "rgba(255, 255, 255, 0.1)" },
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
        {
          type: "slider",
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
      ],
      series: [
        {
          name: labelIn,
          type: "bar",
          data: inflows,
          barMaxWidth: 20,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#34d399" }, // emerald-400
                { offset: 1, color: "#059669" }, // emerald-600
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: labelOut,
          type: "bar",
          data: outflows,
          barMaxWidth: 20,
          itemStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "#f87171" }, // rose-400
                { offset: 1, color: "#dc2626" }, // rose-600
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
        },
        {
          name: labelNet,
          type: "line",
          data: nets,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          showSymbol: false,
          itemStyle: {
            color: "#38bdf8", // sky-400
          },
          lineStyle: {
            width: 2.5,
            color: "#38bdf8",
          },
        },
      ],
    }
  }, [data, t])

  if (isLoading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-[16px] border border-border bg-card p-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-[16px] border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {t("balance.noDataForPeriod")}
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {t("balance.chartTimeline")}
        </h3>
        <span className="text-xs text-muted-foreground">
          {t("balance.entriesCount", { count: data.length })}
        </span>
      </div>
      <div className="h-72 w-full">
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
          opts={{ renderer: "svg" }}
          notMerge
        />
      </div>
    </div>
  )
}

