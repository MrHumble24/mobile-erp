import * as React from "react"
import ReactECharts from "echarts-for-react"
import type { EChartsOption } from "echarts"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { typeI18nKey, type LedgerTypeBreakdownItem } from "@/entities/ledger"
import { Button } from "@/shared/ui/button"

interface Props {
  items: LedgerTypeBreakdownItem[]
  isLoading?: boolean
}

// Sophisticated palette matching dark themes
const OUTFLOW_COLORS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#f59e0b", // amber-500
  "#e11d48", // rose-600
  "#d97706", // amber-600
  "#8b5cf6", // violet-500
  "#64748b", // slate-500
]

const INFLOW_COLORS = [
  "#10b981", // emerald-500
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#14b8a6", // teal-500
  "#6366f1", // indigo-500
  "#84cc16", // lime-500
]

export function CashFlowBreakdownChart({ items, isLoading }: Props) {
  const { t } = useI18n()
  const [direction, setDirection] = React.useState<"out" | "in">("out")

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => item.direction === direction)
  }, [items, direction])

  const totalAmount = React.useMemo(() => {
    return filteredItems.reduce((acc, curr) => acc + curr.amount, 0)
  }, [filteredItems])

  const option = React.useMemo<EChartsOption>(() => {
    const palette = direction === "out" ? OUTFLOW_COLORS : INFLOW_COLORS

    const chartData = filteredItems.map((item, idx) => {
      const key = typeI18nKey(item.typeCode)
      const label = key ? t(key) : item.typeLabel
      return {
        name: label,
        value: item.amount,
        percentage: item.percentage,
        itemStyle: {
          color: palette[idx % palette.length],
        },
      }
    })

    return {
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(18, 24, 38, 0.95)",
        borderColor: "rgba(255, 255, 255, 0.12)",
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (params: unknown) => {
          const item = params as {
            name: string
            value: number
            percent: number
            marker: string
          }
          return `
            <div style="font-weight: 600; margin-bottom: 4px; color: #f8fafc;">${item.name}</div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; font-size: 12px;">
              <span style="color: #cbd5e1;">${item.marker} ${formatMoney(item.value)}</span>
              <span style="font-weight: 700; color: #38bdf8;">${item.percent.toFixed(1)}%</span>
            </div>
          `
        },
      },
      legend: {
        orient: "vertical",
        right: 0,
        top: "middle",
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 10,
        textStyle: {
          color: "#94a3b8",
          fontSize: 11,
        },
        formatter: (name: string) => {
          const matched = chartData.find((d) => d.name === name)
          if (!matched) return name
          const truncated = name.length > 16 ? `${name.slice(0, 15)}…` : name
          return `${truncated} (${matched.percentage}%)`
        },
      },
      series: [
        {
          name: direction === "out" ? t("balance.breakdownOut") : t("balance.breakdownIn"),
          type: "pie",
          radius: ["50%", "72%"],
          center: ["36%", "50%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: "rgba(15, 23, 42, 0.8)",
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            scale: true,
            scaleSize: 6,
            label: {
              show: false,
            },
          },
          data: chartData,
        },
      ],
    }
  }, [filteredItems, direction, t])

  if (isLoading) {
    return (
      <div className="flex h-72 items-center justify-center rounded-[16px] border border-border bg-card p-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-xs)]">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {t(direction === "out" ? "balance.breakdownOut" : "balance.breakdownIn")}
        </h3>
        <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
          <Button
            variant={direction === "out" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => setDirection("out")}
          >
            {t("balance.colOut")}
          </Button>
          <Button
            variant={direction === "in" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs px-2.5"
            onClick={() => setDirection("in")}
          >
            {t("balance.colIn")}
          </Button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-center text-sm text-muted-foreground">
          {t("balance.noDataForPeriod")}
        </div>
      ) : (
        <div className="relative h-64 w-full">
          {/* Centered Total Overlay inside Donut */}
          <div
            className="pointer-events-none absolute inset-y-0 flex flex-col items-center justify-center text-center"
            style={{ left: "36%", transform: "translateX(-50%)" }}
          >
            <span className="text-[11px] font-medium text-muted-foreground">
              {direction === "out" ? t("balance.colOut") : t("balance.colIn")}
            </span>
            <span className="font-mono text-sm font-bold text-foreground">
              {formatMoney(totalAmount)}
            </span>
          </div>

          <ReactECharts
            option={option}
            style={{ height: "100%", width: "100%" }}
            opts={{ renderer: "svg" }}
            notMerge
          />
        </div>
      )}
    </div>
  )
}

