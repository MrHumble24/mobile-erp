import { useI18n } from "@/shared/i18n"
import { formatMoney } from "@/shared/lib/format"
import type { ShipmentStockLine } from "@/entities/shipment"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"

/**
 * The quantity lines bought into this shipment (ADR 0030/0034). Read from the
 * shipment's `stockLines` (its PURCHASE stock movements), so they survive a
 * reload — not the session-only list the add dialog returned.
 * `unitCost`/`lineTotal` are null without the cost permission.
 */
export function ShipmentStockSection({ lines }: { lines: ShipmentStockLine[] }) {
  const { t } = useI18n()
  if (lines.length === 0) return null
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
            {lines.map((line) => (
              <TableRow key={line.id}>
                <TableCell className="text-sm">{`${line.brand} ${line.name}`.trim()}</TableCell>
                <TableCell className="text-sm">{t("catalog.pieces", { count: line.quantity })}</TableCell>
                <TableCell className="text-sm">
                  {line.unitCost == null ? "—" : formatMoney(line.unitCost)}
                </TableCell>
                <TableCell className="text-sm text-right font-semibold">
                  {line.lineTotal == null ? "—" : formatMoney(line.lineTotal)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
