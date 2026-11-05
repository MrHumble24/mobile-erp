import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import { useDeviceModels } from "@/entities/device-model"
import type { PurchasedLineView } from "@/features/add-stock-to-shipment"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

/**
 * The quantity lines bought into this shipment in the current session (ADR 0030).
 * The server has no GET for a shipment's purchases, so this shows only what was
 * just added; it empties on reload (see the feature README's known gap).
 */
export function ShipmentStockSection({ lines }: { lines: PurchasedLineView[] }) {
  const { t } = useI18n()
  const { data: models } = useDeviceModels()
  if (lines.length === 0) return null
  const nameOf = (modelId: string) => {
    const m = models?.find((x) => x.id === modelId)
    return m ? `${m.brand} ${m.name}` : modelId
  }
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{t("catalog.stock")}</h4>
      <div className="rounded-[16px] border border-[#e8e8e8] bg-white overflow-hidden shadow-[var(--shadow-xs)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("inventory.model")}</TableHead>
              <TableHead>{t("catalog.quantity")}</TableHead>
              <TableHead>{t("catalog.unitCost")}</TableHead>
              <TableHead className="text-right">{t("catalog.lineTotal")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line, i) => (
              <TableRow key={`${line.modelId}-${i}`}>
                <TableCell className="text-sm">{nameOf(line.modelId)}</TableCell>
                <TableCell className="text-sm">{t("catalog.pieces", { count: line.quantity })}</TableCell>
                <TableCell className="text-sm">{formatMoney(line.unitCost)}</TableCell>
                <TableCell className="text-sm text-right font-semibold">
                  {formatMoney(line.quantity * Number(line.unitCost))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
