import * as React from "react"
import { useI18n } from "@/shared/i18n"
import { useExpenseReport } from "@/entities/report"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

function ExpenseFilters({
  from,
  to,
  groupBy,
  onFromChange,
  onToChange,
  onGroupByChange,
}: {
  from: string
  to: string
  groupBy: "category" | "month"
  onFromChange: (val: string) => void
  onToChange: (val: string) => void
  onGroupByChange: (val: "category" | "month") => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="space-y-1">
        <Label>{t("reports.dateFrom")}</Label>
        <Input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} className="h-10" />
      </div>
      <div className="space-y-1">
        <Label>{t("reports.dateTo")}</Label>
        <Input type="date" value={to} onChange={(e) => onToChange(e.target.value)} className="h-10" />
      </div>
      <div className="space-y-1">
        <Label>{t("reports.groupBy")}</Label>
        <Select value={groupBy} onValueChange={(val) => onGroupByChange(val as "category" | "month")}>
          <SelectTrigger className="h-10 w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="category">{t("reports.groupByCategory")}</SelectItem>
            <SelectItem value="month">{t("reports.groupByMonth")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function ExpenseReportTable({
  rows,
  groupBy,
  total,
}: {
  rows: Array<{ key: string; label: string; total: number }>
  groupBy: "category" | "month"
  total: number
}) {
  const { t } = useI18n()
  return (
    <div className="rounded-[16px] border border-[#e8e8e8] bg-white overflow-hidden shadow-[var(--shadow-xs)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{groupBy === "category" ? t("expenses.category") : "Oy"}</TableHead>
            <TableHead className="text-right">{t("common.amount")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key}>
              <TableCell className="font-semibold text-sm">{row.label}</TableCell>
              <TableCell className="font-mono font-bold text-sm text-right">
                ${Math.round(row.total).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 border-[#e8e8e8] font-bold bg-[#f8f9fa]">
            <TableCell>{t("common.total")}</TableCell>
            <TableCell className="font-mono text-sm text-right text-destructive font-bold">
              ${Math.round(total).toLocaleString()}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

export function ExpenseReportTab() {
  const { t } = useI18n()
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  const [groupBy, setGroupBy] = React.useState<"category" | "month">("category")

  const { data: rows, isLoading } = useExpenseReport(
    from ? new Date(from).toISOString() : undefined,
    to ? new Date(`${to}T23:59:59.999Z`).toISOString() : undefined,
    groupBy
  )

  const total = React.useMemo(
    () => rows?.reduce((acc, curr) => acc + curr.total, 0) || 0,
    [rows]
  )

  return (
    <div className="space-y-6">
      <ExpenseFilters
        from={from}
        to={to}
        groupBy={groupBy}
        onFromChange={setFrom}
        onToChange={setTo}
        onGroupByChange={setGroupBy}
      />

      {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}

      {rows && <ExpenseReportTable rows={rows} groupBy={groupBy} total={total} />}
    </div>
  )
}

