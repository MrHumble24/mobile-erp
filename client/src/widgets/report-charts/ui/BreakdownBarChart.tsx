import * as React from "react"
import ReactECharts from "echarts-for-react"
import type { EChartsOption } from "echarts"
import { useI18n } from "@/shared/i18n"
import { ChartCard } from "./ChartCard"
import { ShareTable } from "./ShareTable"
import { capWithOther, OTHER_KEY, type SeriesPoint } from "../lib/palette"

export interface BreakdownBarChartProps {
  title: string
  description?: string
  rows: SeriesPoint[]
  labelHeader: string
  valueHeader: string
  formatValue: (value: number) => string
  isLoading?: boolean
  error?: unknown
  csvFilename: string
  limit?: number
  onSelect?: (key: string) => void
  /** Per-bar colors by index (e.g. a sequential ramp); default single hue. */
  colors?: readonly string[]
}

const PALETTE = [
  "#38bdf8", // sky-400
  "#34d399", // emerald-400
  "#fbbf24", // amber-400
  "#a78bfa", // violet-400
  "#f43f5e", // rose-500
  "#2dd4bf", // teal-400
  "#fb923c", // orange-400
  "#818cf8", // indigo-400
  "#ec4899", // pink-500
  "#4ade80", // green-400
]

function EChartsBarView({
  data,
  formatValue,
  onSelect,
  colors,
}: {
  data: SeriesPoint[]
  formatValue: (value: number) => string
  onSelect?: (key: string) => void
  colors?: readonly string[]
}) {
  const { t } = useI18n()

  const option = React.useMemo<EChartsOption>(() => {
    const labels = data.map((d) => d.label)
    const isClickable = Boolean(onSelect)

    const seriesData = data.map((d, i) => {
      const isOther = d.key === OTHER_KEY
      let barColor: string
      if (isOther) {
        barColor = "#64748b" // slate-500
      } else if (colors && colors[i]) {
        barColor = colors[i]
      } else {
        barColor = PALETTE[i % PALETTE.length]
      }

      return {
        value: d.value,
        itemStyle: {
          color: barColor,
          borderRadius: [0, 6, 6, 0],
          cursor: isClickable && !isOther ? "pointer" : "default",
        },
      }
    })

    return {
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(18, 24, 38, 0.96)",
        borderColor: "rgba(255, 255, 255, 0.12)",
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (params: unknown) => {
          const item = params as {
            dataIndex: number
            name: string
          }
          const pt = data[item.dataIndex]
          if (!pt) return ""
          const pct = (pt.share * 100).toFixed(1)
          const clickableHint =
            isClickable && pt.key !== OTHER_KEY
              ? `<div style="margin-top: 6px; font-size: 10px; color: #38bdf8;">${t("reports.breakdownHint")} →</div>`
              : ""

          return `
            <div style="font-weight: 600; margin-bottom: 4px; color: #f8fafc; font-size: 13px;">${pt.label}</div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 20px; font-size: 12px;">
              <span style="font-family: monospace; font-weight: 700; color: #fff;">${formatValue(pt.value)}</span>
              <span style="font-weight: 700; color: #38bdf8;">${pct}%</span>
            </div>
            ${clickableHint}
          `
        },
      },
      grid: {
        left: "2%",
        right: "14%",
        top: "4%",
        bottom: "4%",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        show: false,
      },
      yAxis: {
        type: "category",
        inverse: true,
        data: labels,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: "#cbd5e1",
          fontSize: 12,
          formatter: (val: string) => {
            return val.length > 22 ? `${val.slice(0, 20)}...` : val
          },
        },
      },
      series: [
        {
          type: "bar",
          data: seriesData,
          barMaxWidth: 20,
          label: {
            show: true,
            position: "right",
            distance: 8,
            color: "#94a3b8",
            fontSize: 11,
            formatter: (params: unknown) => {
              const item = params as { dataIndex: number }
              const pt = data[item.dataIndex]
              if (!pt) return ""
              return `${formatValue(pt.value)} (${(pt.share * 100).toFixed(0)}%)`
            },
          },
        },
      ],
    }
  }, [data, formatValue, onSelect, colors, t])

  const onEvents = React.useMemo(
    () => ({
      click: (params: unknown) => {
        const item = params as { dataIndex?: number }
        const idx = item?.dataIndex ?? -1
        const pt = data[idx]
        if (pt && pt.key !== OTHER_KEY && onSelect) {
          onSelect(pt.key)
        }
      },
    }),
    [data, onSelect]
  )

  const chartHeight = Math.max(220, Math.min(500, data.length * 40 + 30))

  return (
    <div style={{ height: chartHeight }} className="w-full">
      <ReactECharts
        option={option}
        onEvents={onEvents}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "svg" }}
        notMerge
      />
    </div>
  )
}

export function BreakdownBarChart(props: BreakdownBarChartProps) {
  const { t } = useI18n()
  const { rows, formatValue, labelHeader, valueHeader } = props
  const data = capWithOther(rows, props.limit ?? 10, t("reports.other"))

  return (
    <ChartCard
      title={props.title}
      description={props.description}
      isLoading={props.isLoading}
      error={props.error}
      isEmpty={!props.isLoading && rows.length === 0}
      csv={{
        filename: props.csvFilename,
        headers: [labelHeader, valueHeader, t("reports.share")],
        rows: data.map((r) => [r.label, Math.round(r.value), `${(r.share * 100).toFixed(1)}%`]),
      }}
      chart={
        <EChartsBarView
          data={data}
          formatValue={formatValue}
          onSelect={props.onSelect}
          colors={props.colors}
        />
      }
      table={
        <ShareTable
          rows={data}
          labelHeader={labelHeader}
          valueHeader={valueHeader}
          formatValue={formatValue}
          onSelect={props.onSelect}
        />
      }
    />
  )
}
