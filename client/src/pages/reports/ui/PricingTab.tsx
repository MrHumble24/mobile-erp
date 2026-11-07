import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useModelPricingReport, type ModelPricingRow } from "@/entities/report"
import { useDeviceModels } from "@/entities/device-model"
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { PricePairChart, type PricePairDatum } from "./PricePairChart"
import type { ReportTabProps } from "../model/tab-props"

const margin = (row: ModelPricingRow): string => {
  if (!row.avgSellingPrice || !row.avgLandedCost) return "—"
  return `${(((row.avgSellingPrice - row.avgLandedCost) / row.avgLandedCost) * 100).toFixed(1)}%`
}

function PricingRows({
  rows,
  nameOf,
  canViewCost,
}: {
  rows: ModelPricingRow[]
  nameOf: (id: string) => string
  canViewCost: boolean
}) {
  return (
    <TableBody>
      {rows.map((row, i) => (
        <TableRow key={`${row.modelId}-${row.storage}-${i}`}>
          <TableCell className="text-sm font-semibold">{nameOf(row.modelId)}</TableCell>
          <TableCell className="text-sm">{row.storage || "—"}</TableCell>
          {canViewCost && (
            <TableCell className="font-mono text-sm text-muted-foreground">
              {formatMoney(row.avgLandedCost)}
            </TableCell>
          )}
          <TableCell className="font-mono text-sm font-semibold text-emerald-500">
            {formatMoney(row.avgSellingPrice)}
          </TableCell>
          {canViewCost && (
            <TableCell className="font-mono text-sm font-semibold text-sky-400">
              {margin(row)}
            </TableCell>
          )}
          <TableCell className="text-sm">{row.unitsInStock}</TableCell>
          <TableCell className="text-sm">{row.unitsSold}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  )
}

export function PricingTab({ canViewCost }: ReportTabProps) {
  const { t } = useI18n()
  const { data: pricing } = useModelPricingReport()
  const { data: models } = useDeviceModels()
  const nameOf = (id: string) =>
    models?.find((m) => m.id === id)?.brand
      ? `${models.find((m) => m.id === id)!.brand} ${models.find((m) => m.id === id)!.name}`
      : id

  const rows = pricing ?? []
  const pairData: PricePairDatum[] = rows
    .filter((r) => r.avgSellingPrice && r.avgLandedCost)
    .slice(0, 12)
    .map((r) => ({
      model: `${nameOf(r.modelId)} ${r.storage ?? ""}`.trim(),
      landed: r.avgLandedCost ?? 0,
      selling: r.avgSellingPrice ?? 0,
    }))

  return (
    <div className="space-y-6">
      {canViewCost && pairData.length > 0 && (
        <Card className="rounded-[16px]">
          <CardHeader>
            <CardTitle className="text-base">{t("reports.pricePair")}</CardTitle>
            <CardDescription>
              {t("reports.margin")} tahlili (eng ommabop 12 ta model)
            </CardDescription>
          </CardHeader>
          <PricePairChart data={pairData} />
        </Card>
      )}

      <div className="overflow-hidden rounded-[16px] border border-border bg-card shadow-[var(--shadow-xs)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("inventory.model")}</TableHead>
              <TableHead>{t("inventory.storage")}</TableHead>
              {canViewCost && <TableHead>{t("dashboard.avgLandedCost")}</TableHead>}
              <TableHead>{t("dashboard.avgSellingPrice")}</TableHead>
              {canViewCost && <TableHead>{t("reports.margin")}</TableHead>}
              <TableHead>{t("dashboard.unitsInStock")}</TableHead>
              <TableHead>{t("dashboard.unitsSold")}</TableHead>
            </TableRow>
          </TableHeader>
          <PricingRows rows={rows} nameOf={nameOf} canViewCost={canViewCost} />
        </Table>
      </div>
    </div>
  )
}
