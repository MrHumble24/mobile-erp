import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts"
import { useI18n } from "@/shared/i18n"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui/chart"
import { ChartCard } from "./ChartCard"
import { ShareTable } from "./ShareTable"
import { capWithOther, OTHER_COLOR, OTHER_KEY, type SeriesPoint } from "../lib/palette"

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

const CONFIG: ChartConfig = { value: { color: "var(--chart-1)" } }

function BarView({
  data,
  max,
  formatValue,
  onSelect,
  colors,
}: {
  data: SeriesPoint[]
  max: number
  formatValue: (value: number) => string
  onSelect?: (key: string) => void
  colors?: readonly string[]
}) {
  return (
    <ChartContainer config={CONFIG} className="aspect-auto h-[clamp(220px,40vh,420px)] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 12, right: 48 }} barCategoryGap={6}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="label" width={120} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              valueFormatter={(v, item) =>
                `${formatValue(v)} · ${((Number(item.payload?.share) || 0) * 100).toFixed(1)}%`
              }
            />
          }
        />
        <Bar
          dataKey="value"
          radius={[0, 4, 4, 0]}
          onClick={(entry: SeriesPoint) => entry.key !== OTHER_KEY && onSelect?.(entry.key)}
          cursor={onSelect ? "pointer" : undefined}
        >
          {data.map((row, i) => (
            <Cell key={row.key} fill={row.key === OTHER_KEY ? OTHER_COLOR : colors?.[i] ?? "var(--chart-1)"} />
          ))}
          <LabelList dataKey="value" position="right" content={(p) => maxLabel(p, max, formatValue)} />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

function maxLabel(
  p: { x?: string | number; y?: string | number; width?: string | number; height?: string | number; value?: string | number; index?: number },
  max: number,
  formatValue: (value: number) => string
) {
  if (p.value !== max || p.index === undefined) return null
  return (
    <text x={Number(p.x) + Number(p.width) + 6} y={Number(p.y) + Number(p.height) / 2} fill="#646464" fontSize={11} dominantBaseline="middle">
      {formatValue(Number(p.value))}
    </text>
  )
}

export function BreakdownBarChart(props: BreakdownBarChartProps) {
  const { t } = useI18n()
  const { rows, formatValue, labelHeader, valueHeader } = props
  const data = capWithOther(rows, props.limit ?? 10, t("reports.other"))
  const max = Math.max(0, ...data.map((r) => r.value))

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
      chart={<BarView data={data} max={max} formatValue={formatValue} onSelect={props.onSelect} colors={props.colors} />}
      table={
        <ShareTable rows={data} labelHeader={labelHeader} valueHeader={valueHeader} formatValue={formatValue} onSelect={props.onSelect} />
      }
    />
  )
}
