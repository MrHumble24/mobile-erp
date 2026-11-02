import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useI18n } from "@/shared/i18n"
import { formatDate, formatMoney } from "@/shared/lib/format"
import type { TrendPoint } from "@/entities/report"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { ChartCard } from "./ChartCard"

export interface TrendChartProps {
  title: string
  description?: string
  data: TrendPoint[]
  isLoading?: boolean
  error?: unknown
}

const compact = (v: number): string =>
  new Intl.NumberFormat("en-US", { notation: "compact" }).format(v)

function useTrendConfig(): ChartConfig {
  const { t } = useI18n()
  return {
    revenue: { label: t("dashboard.revenue"), color: "var(--chart-1)" },
    grossProfit: { label: t("dashboard.grossProfit"), color: "var(--chart-3)" },
    expenses: { label: t("dashboard.expenses"), color: "var(--chart-2)" },
  }
}

function TrendTable({ data }: { data: TrendPoint[] }) {
  const { t } = useI18n()
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("common.date")}</TableHead>
          <TableHead className="text-right">{t("dashboard.revenue")}</TableHead>
          <TableHead className="text-right">{t("dashboard.grossProfit")}</TableHead>
          <TableHead className="text-right">{t("dashboard.expenses")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((p) => (
          <TableRow key={p.bucket}>
            <TableCell className="text-sm">{formatDate(p.bucket)}</TableCell>
            <TableCell className="font-mono text-sm text-right">{formatMoney(p.revenue)}</TableCell>
            <TableCell className="font-mono text-sm text-right">{formatMoney(p.grossProfit)}</TableCell>
            <TableCell className="font-mono text-sm text-right">{formatMoney(p.expenses)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function TrendArea({ data, config }: { data: TrendPoint[]; config: ChartConfig }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-[300px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 16, top: 8 }}>
        <CartesianGrid vertical={false} stroke="#e8e8e8" />
        <XAxis
          dataKey="bucket"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v) => formatDate(String(v))}
        />
        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={compact} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(l) => formatDate(String(l))}
              valueFormatter={(v) => formatMoney(v)}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {(["revenue", "grossProfit", "expenses"] as const).map((key) => (
          <Area
            key={key}
            dataKey={key}
            type="monotone"
            stroke={`var(--color-${key})`}
            fill={`var(--color-${key})`}
            fillOpacity={0.12}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  )
}

export function TrendChart({ title, description, data, isLoading, error }: TrendChartProps) {
  const config = useTrendConfig()
  return (
    <ChartCard
      title={title}
      description={description}
      isLoading={isLoading}
      error={error}
      isEmpty={!isLoading && data.length === 0}
      csv={{
        filename: "trend",
        headers: ["bucket", "revenue", "cogs", "grossProfit", "expenses", "unitsSold", "returnsRefunded"],
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
      chart={<TrendArea data={data} config={config} />}
      table={<TrendTable data={data} />}
    />
  )
}
