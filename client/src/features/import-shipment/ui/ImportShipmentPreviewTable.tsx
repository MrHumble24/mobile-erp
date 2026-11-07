import { AlertCircle, AlertTriangle } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { Badge } from "@/shared/ui/badge"
import type {
  ImportShipmentProblem,
  ImportShipmentRow,
  ImportShipmentWarning,
} from "../model/import-shipment.types"

interface PreviewTableProps {
  rows: ImportShipmentRow[]
  exchangeRate: number
  problemsMap: Map<number, ImportShipmentProblem[]>
  warningsMap: Map<number, ImportShipmentWarning[]>
}

function RowProblems({ problems }: { problems: ImportShipmentProblem[] }) {
  return (
    <div className="mt-1 space-y-0.5 text-xs text-destructive">
      {problems.map((p, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <AlertCircle className="size-3 shrink-0" />
          <span>{p.detail || p.code}</span>
        </div>
      ))}
    </div>
  )
}

function RowWarnings({ warnings }: { warnings: ImportShipmentWarning[] }) {
  return (
    <div className="mt-1 space-y-0.5 text-xs text-amber-600">
      {warnings.map((w, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <AlertTriangle className="size-3 shrink-0" />
          <span>{w.detail || w.code}</span>
        </div>
      ))}
    </div>
  )
}

function PreviewTableRow({
  row: r,
  exchangeRate,
  problems,
  warnings,
}: {
  row: ImportShipmentRow
  exchangeRate: number
  problems?: ImportShipmentProblem[]
  warnings?: ImportShipmentWarning[]
}) {
  const hasProblem = Boolean(problems?.length)
  const hasWarning = Boolean(warnings?.length)
  const usdCost = exchangeRate > 0 ? (r.price / exchangeRate).toFixed(2) : "-"
  const rowClass = hasProblem
    ? "bg-destructive/10 hover:bg-destructive/15"
    : hasWarning
      ? "bg-amber-500/10 hover:bg-amber-500/15"
      : ""

  return (
    <TableRow className={`text-xs ${rowClass}`}>
      <TableCell className="font-mono text-muted-foreground">{r.row}</TableCell>
      <TableCell className="font-medium">
        {r.modelName}
        {problems && <RowProblems problems={problems} />}
        {warnings && <RowWarnings warnings={warnings} />}
      </TableCell>
      <TableCell className="font-mono">
        <div>{r.imei}</div>
        {r.imei2 && <div className="text-[11px] text-muted-foreground">{r.imei2}</div>}
      </TableCell>
      <TableCell className="text-right tabular-nums">{r.price}</TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {usdCost !== "-" ? formatMoney(usdCost) : "-"}
      </TableCell>
      <TableCell className="text-right tabular-nums">{formatMoney(r.expense)}</TableCell>
      <TableCell className="text-right tabular-nums">
        {r.markup != null ? formatMoney(r.markup) : "-"}
      </TableCell>
      <TableCell className="text-center tabular-nums">
        {r.batteryHealth != null ? `${r.batteryHealth}%` : "-"}
      </TableCell>
      <TableCell className="max-w-[150px] truncate" title={r.defects}>
        {r.defects || "-"}
      </TableCell>
    </TableRow>
  )
}

export function ImportShipmentPreviewTable({
  rows,
  exchangeRate,
  problemsMap,
  warningsMap,
}: PreviewTableProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-sm font-semibold">{t("shipments.sheetRowsPreview")}</h4>
        <Badge variant="outline" className="text-xs">
          {t("shipments.rowCount", { count: rows.length })}
        </Badge>
      </div>

      <div className="max-h-[36vh] overflow-y-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="w-12">#</TableHead>
              <TableHead>{t("customs.model")}</TableHead>
              <TableHead>IMEI</TableHead>
              <TableHead className="text-right">{t("shipments.priceOriginal")}</TableHead>
              <TableHead className="text-right">{t("shipments.priceUsd")}</TableHead>
              <TableHead className="text-right">{t("shipments.expense")}</TableHead>
              <TableHead className="text-right">{t("shipments.markup")}</TableHead>
              <TableHead className="text-center">{t("shipments.battery")}</TableHead>
              <TableHead>{t("shipments.defects")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <PreviewTableRow
                key={r.row}
                row={r}
                exchangeRate={exchangeRate}
                problems={problemsMap.get(r.row)}
                warnings={warningsMap.get(r.row)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
