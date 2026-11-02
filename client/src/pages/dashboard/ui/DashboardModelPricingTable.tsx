import { TrendingUp } from "lucide-react"
import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useAuthStore } from "@/features/auth"
import { useModelPricingReport, type ModelPricingRow } from "@/entities/report"
import { useDeviceModels } from "@/entities/device-model"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

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
      <TableCell className="font-semibold text-sm">{modelName}</TableCell>
      <TableCell className="text-sm">{row.storage || "—"}</TableCell>
      {hasCostView && (
        <TableCell className="font-mono text-sm text-muted-foreground">
          {row.avgAcquisitionCost ? formatMoney(row.avgAcquisitionCost) : "—"}
        </TableCell>
      )}
      <TableCell className="font-mono text-sm font-semibold text-emerald-600">
        {row.avgSellingPrice ? formatMoney(row.avgSellingPrice) : "—"}
      </TableCell>
      <TableCell className="text-sm">{row.unitsInStock}</TableCell>
      <TableCell className="text-sm font-medium">{row.unitsSold}</TableCell>
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <TrendingUp className="size-4 text-primary" />
        <CardTitle className="text-base">{t("dashboard.modelPricingTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}
        {pricing && pricing.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">Ma'lumotlar mavjud emas.</p>
        )}
        {pricing && pricing.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("inventory.model")}</TableHead>
                <TableHead>{t("inventory.storage")}</TableHead>
                {hasCostView && <TableHead>{t("dashboard.avgAcquisitionCost")}</TableHead>}
                <TableHead>{t("dashboard.avgSellingPrice")}</TableHead>
                <TableHead>{t("dashboard.unitsInStock")}</TableHead>
                <TableHead>{t("dashboard.unitsSold")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pricing.map((row, idx) => (
                <DashboardPricingRow
                  key={`${row.modelId}-${row.storage}-${idx}`}
                  row={row}
                  modelName={modelMap.get(row.modelId) || row.modelId}
                  hasCostView={hasCostView}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

