import * as React from "react"
import { Download } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatDate, formatMoney } from "@/shared/lib/format"
import { downloadCsv } from "@/shared/lib/csv"
import { todayIso } from "@/shared/lib/local-date"
import {
  useDailyClosingReport,
  useDailyClosingRange,
  type DailyClosingReport,
} from "@/entities/report"
import { MetricCard } from "@/shared/ui/metric-card"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import type { ReportTabProps } from "../model/tab-props"

function ClosingCards({ report }: { report: DailyClosingReport }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard label={t("dashboard.revenue")} value={formatMoney(report.revenue)} subtext={`${report.unitsSold} ${t("dashboard.unitsSold")}`} variant="white" />
      <MetricCard label={t("dashboard.grossProfit")} value={formatMoney(report.grossProfit)} variant="white" />
      <MetricCard label={t("dashboard.expenses")} value={formatMoney(report.expenses)} variant="dark" />
      <MetricCard label={t("reports.settled")} value={String(report.settledConsignments)} variant="white" />
    </div>
  )
}

function closingTotals(rows: DailyClosingReport[]) {
  return rows.reduce(
    (a, r) => ({
      revenue: a.revenue + r.revenue,
      grossProfit: a.grossProfit + r.grossProfit,
      expenses: a.expenses + r.expenses,
      unitsSold: a.unitsSold + r.unitsSold,
    }),
    { revenue: 0, grossProfit: 0, expenses: 0, unitsSold: 0 }
  )
}

function ClosingRangeTable({ rows }: { rows: DailyClosingReport[] }) {
  const { t } = useI18n()
  const totals = closingTotals(rows)
  const exportCsv = () =>
    downloadCsv(
      "daily-closing",
      ["date", "unitsSold", "revenue", "grossProfit", "expenses"],
      rows.map((r) => [r.date, r.unitsSold, Math.round(r.revenue), Math.round(r.grossProfit), Math.round(r.expenses)])
    )
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 rounded-full px-3 text-xs" onClick={exportCsv}>
          <Download className="size-3.5" />
          {t("reports.exportCsv")}
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.date")}</TableHead>
            <TableHead className="text-right">{t("dashboard.unitsSold")}</TableHead>
            <TableHead className="text-right">{t("dashboard.revenue")}</TableHead>
            <TableHead className="text-right">{t("dashboard.grossProfit")}</TableHead>
            <TableHead className="text-right">{t("dashboard.expenses")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.date}>
              <TableCell className="text-sm">{formatDate(r.date)}</TableCell>
              <TableCell className="text-sm text-right">{r.unitsSold}</TableCell>
              <TableCell className="font-mono text-sm text-right">{formatMoney(r.revenue)}</TableCell>
              <TableCell className="font-mono text-sm text-right">{formatMoney(r.grossProfit)}</TableCell>
              <TableCell className="font-mono text-sm text-right">{formatMoney(r.expenses)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 border-border bg-muted font-bold">
            <TableCell>{t("common.total")}</TableCell>
            <TableCell className="text-right">{totals.unitsSold}</TableCell>
            <TableCell className="font-mono text-sm text-right">{formatMoney(totals.revenue)}</TableCell>
            <TableCell className="font-mono text-sm text-right">{formatMoney(totals.grossProfit)}</TableCell>
            <TableCell className="font-mono text-sm text-right">{formatMoney(totals.expenses)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

export function ClosingTab({ range }: ReportTabProps) {
  const { t } = useI18n()
  const [date, setDate] = React.useState(todayIso)
  const day = useDailyClosingReport(date)
  const rangeData = useDailyClosingRange(range.from, range.to)

  return (
    <div className="space-y-6">
      <div className="w-64 space-y-1">
        <Label>{t("reports.selectDate")}</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10" />
      </div>
      {day.data && <ClosingCards report={day.data} />}
      <ClosingRangeTable rows={rangeData.data ?? []} />
    </div>
  )
}
