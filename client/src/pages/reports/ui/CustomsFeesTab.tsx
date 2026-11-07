import * as React from "react"
import ReactECharts from "echarts-for-react"
import type { EChartsOption } from "echarts"
import { useI18n } from "@/shared/i18n"
import { formatDate, formatMoney } from "@/shared/lib/format"
import { useCurrentPriceList, useFeeHistory, type FeeHistoryPoint } from "@/entities/customs"
import { ChartCard } from "@/widgets/report-charts"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

function FeeECharts({ data }: { data: FeeHistoryPoint[] }) {
  const { t } = useI18n()

  const option = React.useMemo<EChartsOption>(() => {
    const dates = data.map((d) => d.effectiveAt)
    const fees = data.map((d) => Number(d.fee))

    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(18, 24, 38, 0.96)",
        borderColor: "rgba(255, 255, 255, 0.12)",
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: "#f1f5f9", fontSize: 12 },
        formatter: (params: unknown) => {
          const items = Array.isArray(params) ? params : [params]
          if (items.length === 0) return ""
          const first = items[0] as { dataIndex: number }
          const idx = first?.dataIndex ?? 0
          const item = data[idx]
          if (!item) return ""

          return `
            <div style="font-weight: 600; margin-bottom: 6px; color: #f8fafc; font-size: 13px;">
              ${formatDate(item.effectiveAt)}
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; font-size: 12px;">
              <span style="color: #cbd5e1;">${t("customs.fee")}:</span>
              <span style="font-family: monospace; font-weight: 700; color: #38bdf8;">${formatMoney(item.fee)}</span>
            </div>
          `
        },
      },
      grid: {
        left: "3%",
        right: "3%",
        bottom: "10%",
        top: "10%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: dates,
        axisLine: { lineStyle: { color: "rgba(255, 255, 255, 0.12)" } },
        axisLabel: {
          color: "#94a3b8",
          fontSize: 11,
          formatter: (v: string) => formatDate(v),
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
          formatter: (v: number) => {
            if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`
            return `$${v}`
          },
        },
      },
      series: [
        {
          name: t("customs.fee"),
          type: "line",
          step: "end",
          data: fees,
          symbol: "circle",
          symbolSize: 6,
          itemStyle: { color: "#38bdf8" },
          lineStyle: { width: 2.5, color: "#38bdf8" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(56, 189, 248, 0.2)" },
                { offset: 1, color: "rgba(56, 189, 248, 0.0)" },
              ],
            },
          },
        },
      ],
    }
  }, [data, t])

  return (
    <div className="h-[300px] w-full">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        opts={{ renderer: "svg" }}
        notMerge
      />
    </div>
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
        chart={<FeeECharts data={data} />}
        table={<FeeTable data={data} />}
      />
    </div>
  )
}
