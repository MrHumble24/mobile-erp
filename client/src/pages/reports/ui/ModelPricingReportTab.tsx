import { useI18n } from "@/shared/i18n"
import { useAuthStore } from "@/features/auth"
import { useModelPricingReport, type ModelPricingRow } from "@/entities/report"
import { useDeviceModels } from "@/entities/device-model"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

function ModelPricingRowItem({
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
          {row.avgAcquisitionCost ? `$${Math.round(row.avgAcquisitionCost)}` : "—"}
        </TableCell>
      )}
      {hasCostView && (
        <TableCell className="font-mono text-sm text-muted-foreground">
          {row.avgLandedCost ? `$${Math.round(row.avgLandedCost)}` : "—"}
        </TableCell>
      )}
      <TableCell className="font-mono text-sm font-semibold text-emerald-600">
        {row.avgSellingPrice ? `$${Math.round(row.avgSellingPrice)}` : "—"}
      </TableCell>
      <TableCell className="text-sm">{row.unitsInStock}</TableCell>
      <TableCell className="text-sm font-medium">{row.unitsSold}</TableCell>
    </TableRow>
  )
}

export function ModelPricingReportTab() {
  const { t } = useI18n()
  const hasCostView = useAuthStore(
    (s) => s.user?.permissions?.includes("device.cost.view") ?? false
  )
  const { data: pricing, isLoading } = useModelPricingReport()
  const { data: models } = useDeviceModels()
  const modelMap = new Map(models?.map((m) => [m.id, `${m.brand} ${m.name}`]))

  return (
    <div className="space-y-4">
      {isLoading && <p className="text-sm text-muted-foreground">{t("common.loading")}</p>}

      {pricing && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("inventory.model")}</TableHead>
              <TableHead>{t("inventory.storage")}</TableHead>
              {hasCostView && <TableHead>{t("dashboard.avgAcquisitionCost")}</TableHead>}
              {hasCostView && <TableHead>{t("dashboard.avgLandedCost")}</TableHead>}
              <TableHead>{t("dashboard.avgSellingPrice")}</TableHead>
              <TableHead>{t("dashboard.unitsInStock")}</TableHead>
              <TableHead>{t("dashboard.unitsSold")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pricing.map((row, idx) => (
              <ModelPricingRowItem
                key={`${row.modelId}-${row.storage}-${idx}`}
                row={row}
                modelName={modelMap.get(row.modelId) || row.modelId}
                hasCostView={hasCostView}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

