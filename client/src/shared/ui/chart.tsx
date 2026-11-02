import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/shared/lib/utils"

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
  }
>

interface ChartContextValue {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextValue | null>(null)

function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) throw new Error("useChart must be used within <ChartContainer>")
  return ctx
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"]
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-[#838383] [&_.recharts-cartesian-grid_line]:stroke-[#e8e8e8] [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-[#e8e8e8]",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorEntries = Object.entries(config).filter(([, v]) => v.color)
  if (!colorEntries.length) return null
  const css = colorEntries
    .map(([key, v]) => `  --color-${key}: ${v.color};`)
    .join("\n")
  return (
    <style
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: `[data-chart=${id}] {\n${css}\n}` }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

interface TooltipItem {
  name?: string | number
  value?: number | string
  dataKey?: string | number
  color?: string
  payload?: Record<string, unknown>
}

function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
  hideLabel,
}: {
  active?: boolean
  payload?: TooltipItem[]
  label?: React.ReactNode
  labelFormatter?: (label: React.ReactNode) => React.ReactNode
  valueFormatter?: (value: number, item: TooltipItem) => React.ReactNode
  hideLabel?: boolean
}) {
  const { config } = useChart()
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-[10px] border border-[#e8e8e8] bg-white px-3 py-2 text-xs shadow-[var(--shadow-md)]">
      {!hideLabel && (
        <p className="mb-1 font-semibold text-[#202020]">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((item, i) => {
          const key = String(item.dataKey ?? item.name ?? i)
          const labelText = config[key]?.label ?? item.name ?? key
          const numeric =
            typeof item.value === "number" ? item.value : Number(item.value)
          return (
            <div key={key} className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-[2px]"
                style={{ background: item.color ?? config[key]?.color }}
              />
              <span className="text-[#646464]">{labelText}</span>
              <span className="ml-auto font-mono font-semibold text-[#202020]">
                {valueFormatter
                  ? valueFormatter(numeric, item)
                  : item.value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

interface LegendItem {
  value?: string
  dataKey?: string | number
  color?: string
}

function ChartLegendContent({
  payload,
  className,
}: {
  payload?: LegendItem[]
  className?: string
}) {
  const { config } = useChart()
  if (!payload?.length) return null
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4 pt-3", className)}>
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.value ?? "")
        return (
          <div key={key} className="flex items-center gap-1.5 text-xs text-[#646464]">
            <span
              className="size-2.5 rounded-[2px]"
              style={{ background: item.color }}
            />
            {config[key]?.label ?? item.value}
          </div>
        )
      })}
    </div>
  )
}

export {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}
