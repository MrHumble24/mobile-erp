import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui/chart"

export interface PricePairDatum {
  model: string
  landed: number
  selling: number
}

const compact = (v: number): string =>
  new Intl.NumberFormat("en-US", { notation: "compact", style: "currency", currency: "USD" }).format(v)

export function PricePairChart({ data }: { data: PricePairDatum[] }) {
  const { t } = useI18n()
  const config: ChartConfig = {
    landed: { label: t("dashboard.avgLandedCost"), color: "var(--chart-3)" },
    selling: { label: t("dashboard.avgSellingPrice"), color: "var(--chart-1)" },
  }
  return (
    <ChartContainer config={config} className="aspect-auto h-[320px] w-full">
      <BarChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} stroke="#e8e8e8" />
        <XAxis dataKey="model" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={compact} />
        <ChartTooltip content={<ChartTooltipContent valueFormatter={(v) => formatMoney(v)} />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="landed" fill="var(--color-landed)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="selling" fill="var(--color-selling)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
