import { Smartphone, ArrowRight } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useAuthStore } from "@/features/auth"
import { useModelPricingReport, type ModelPricingRow } from "@/entities/report"
import { useDeviceModels } from "@/entities/device-model"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card"
import { Link } from "@/shared/ui/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

const calcMargin = (row: ModelPricingRow): string => {
  if (!row.avgSellingPrice || !row.avgLandedCost) return "—"
  return `${(((row.avgSellingPrice - row.avgLandedCost) / row.avgLandedCost) * 100).toFixed(1)}%`
}

function DashboardPricingRow({
  row,
  modelName,
  hasCostView,
}: {
  row: ModelPricingRow
  modelName: string
  hasCostView: boolean
}) {
  return (
    <TableRow>
      <TableCell className="font-semibold text-xs text-foreground">{modelName}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{row.storage || "—"}</TableCell>
      {hasCostView && (
        <TableCell className="font-mono text-xs text-muted-foreground">
          {row.avgLandedCost ? formatMoney(row.avgLandedCost) : "—"}
        </TableCell>
      )}
      <TableCell className="font-mono text-xs font-bold text-emerald-500">
        {row.avgSellingPrice ? formatMoney(row.avgSellingPrice) : "—"}
      </TableCell>
      {hasCostView && (
        <TableCell className="font-mono text-xs font-bold text-sky-400">
          {calcMargin(row)}
        </TableCell>
      )}
      <TableCell className="font-mono text-xs text-foreground">{row.unitsInStock}</TableCell>
      <TableCell className="font-mono text-xs font-semibold text-foreground text-right">{row.unitsSold}</TableCell>
    </TableRow>
  )
}

export function DashboardModelPricingTable() {
  const { t } = useI18n()
  const hasCostView = useAuthStore(
    (s) => s.user?.permissions?.includes("device.cost.view") ?? false
  )
  const { data: pricing, isLoading } = useModelPricingReport()
  const { data: models } = useDeviceModels()
  const modelMap = new Map(models?.map((m) => [m.id, `${m.brand} ${m.name}`]))

  const topRows = (pricing ?? []).slice(0, 8)

  return (
    <Card className="rounded-[20px] overflow-hidden shadow-[var(--shadow-xs)]">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Smartphone className="size-4" />
          </div>
          <div>
            <CardTitle className="text-base font-bold">
              {t("dashboard.topModels")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("dashboard.modelPricingTitle")}
            </CardDescription>
          </div>
        </div>

        <Link
          to="/reports?tab=pricing"
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 no-underline"
        >
          <span>{t("dashboard.viewAll")}</span>
          <ArrowRight className="size-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading && (
          <div className="p-6 text-center text-xs text-muted-foreground">
            {t("common.loading")}
          </div>
        )}

        {topRows.length === 0 && !isLoading && (
          <p className="text-xs text-muted-foreground py-8 text-center">
            Ma'lumotlar mavjud emas.
          </p>
        )}

        {topRows.length > 0 && (
          <div className="overflow-x-auto border-t border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-bold">{t("inventory.model")}</TableHead>
                  <TableHead className="text-xs font-bold">{t("inventory.storage")}</TableHead>
                  {hasCostView && <TableHead className="text-xs font-bold">{t("dashboard.avgLandedCost")}</TableHead>}
                  <TableHead className="text-xs font-bold">{t("dashboard.avgSellingPrice")}</TableHead>
                  {hasCostView && <TableHead className="text-xs font-bold">{t("reports.margin")}</TableHead>}
                  <TableHead className="text-xs font-bold">{t("dashboard.unitsInStock")}</TableHead>
                  <TableHead className="text-xs font-bold text-right">{t("dashboard.unitsSold")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topRows.map((row, idx) => (
                  <DashboardPricingRow
                    key={`${row.modelId}-${row.storage}-${idx}`}
                    row={row}
                    modelName={modelMap.get(row.modelId) || row.modelId}
                    hasCostView={hasCostView}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
