import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { useI18n } from "@/shared/i18n"
import { formatDate, formatMoney } from "@/shared/lib/format"
import { useCurrentPriceList, useFeeHistory, type FeeHistoryPoint } from "@/entities/customs"
import { ChartCard } from "@/widgets/report-charts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui/chart"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

const compact = (v: number): string =>
  new Intl.NumberFormat("en-US", { notation: "compact" }).format(v)

function FeeLineChart({ data, config }: { data: FeeHistoryPoint[]; config: ChartConfig }) {
  const points = data.map((p) => ({ effectiveAt: p.effectiveAt, fee: Number(p.fee) }))
  return (
    <ChartContainer config={config} className="aspect-auto h-[300px] w-full">
      <LineChart data={points} margin={{ left: 4, right: 16, top: 8 }}>
        <CartesianGrid vertical={false} stroke="#e8e8e8" />
        <XAxis
          dataKey="effectiveAt"
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
        <Line dataKey="fee" type="stepAfter" stroke="var(--color-fee)" strokeWidth={2} dot />
      </LineChart>
    </ChartContainer>
  )
}

function FeeTable({ data }: { data: FeeHistoryPoint[] }) {
  const { t } = useI18n()
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("customs.effectiveAt")}</TableHead>
          <TableHead className="text-right">{t("customs.fee")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((p) => (
          <TableRow key={p.listId}>
            <TableCell className="text-sm">{formatDate(p.effectiveAt)}</TableCell>
            <TableCell className="font-mono text-sm text-right">{formatMoney(p.fee)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function CodePicker({ value, onChange, codes }: { value: string; onChange: (v: string) => void; codes: string[] }) {
  const { t } = useI18n()
  return (
    <div className="w-64 space-y-1">
      <Label>{t("customs.pickCode")}</Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger className="h-10"><SelectValue placeholder={t("customs.pickCode")} /></SelectTrigger>
        <SelectContent>
          {codes.map((c) => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function CustomsFeesTab() {
  const { t } = useI18n()
  const current = useCurrentPriceList()
  const codes = React.useMemo(
    () => (current.data?.items ?? []).map((i) => i.customsCode),
    [current.data]
  )
  const [code, setCode] = React.useState("")
  const selected = code || codes[0] || ""
  const history = useFeeHistory(selected || null)
  const config: ChartConfig = { fee: { label: t("customs.fee"), color: "var(--chart-1)" } }
  const data = history.data ?? []

  return (
    <div className="space-y-6">
      <CodePicker value={selected} onChange={setCode} codes={codes} />
      <ChartCard
        title={t("customs.history")}
        description={selected}
        isLoading={history.isLoading}
        error={history.error}
        isEmpty={!history.isLoading && (!selected || data.length === 0)}
        csv={{
          filename: `customs-fee-${selected}`,
          headers: ["effectiveAt", "fee"],
          rows: data.map((p) => [p.effectiveAt, Math.round(Number(p.fee))]),
        }}
        chart={<FeeLineChart data={data} config={config} />}
        table={<FeeTable data={data} />}
      />
    </div>
  )
}
