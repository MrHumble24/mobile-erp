import type { TrendPoint } from "@/entities/report"
import { ChartCard } from "./ChartCard"
import { EChartsTrend } from "./EChartsTrend"
import { TrendTable } from "./TrendTable"

export interface TrendChartProps {
  title: string
  description?: string
  data: TrendPoint[]
  isLoading?: boolean
  error?: unknown
}

export function TrendChart({ title, description, data, isLoading, error }: TrendChartProps) {
  return (
    <ChartCard
      title={title}
      description={description}
      isLoading={isLoading}
      error={error}
      isEmpty={!isLoading && data.length === 0}
      csv={{
        filename: "trend",
        headers: [
          "bucket",
          "revenue",
          "cogs",
          "grossProfit",
          "expenses",
          "unitsSold",
          "returnsRefunded",
        ],
        rows: data.map((p) => [
          p.bucket,
          Math.round(p.revenue),
          Math.round(p.cogs),
          Math.round(p.grossProfit),
          Math.round(p.expenses),
          p.unitsSold,
          Math.round(p.returnsRefunded),
        ]),
      }}
      chart={<EChartsTrend data={data} />}
      table={<TrendTable data={data} />}
    />
  )
}
