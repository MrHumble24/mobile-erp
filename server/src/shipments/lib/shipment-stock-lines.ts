import { Prisma } from '../../generated/client/client.js';
import type { ShipmentStockLine } from '../../stock/types/stock.types.js';
import type { ShipmentStockLineView } from '../types/shipment.types.js';

/** Map stock PURCHASE lines to the shipment view, redacting cost per permission. */
export function toStockLineViews(
  lines: ShipmentStockLine[],
  canViewCost: boolean,
): ShipmentStockLineView[] {
  return lines.map((l) => ({
    id: l.id,
    modelId: l.modelId,
    brand: l.brand,
    name: l.name,
    quantity: l.quantity,
    unitCost: canViewCost ? l.unitCost.toFixed(2) : null,
    lineTotal: canViewCost ? l.lineTotal.toFixed(2) : null,
    occurredAt: l.occurredAt,
  }));
}

/** Σ lineTotal, as a 2-dp string. */
export function sumLineTotals(lines: ShipmentStockLine[]): string {
  return lines
    .reduce((sum, l) => sum.plus(l.lineTotal), new Prisma.Decimal(0))
    .toFixed(2);
}

/** A nullable Decimal total as a 2-dp string ("0.00" when absent). */
export function str(total?: Prisma.Decimal): string {
  return (total ?? new Prisma.Decimal(0)).toFixed(2);
}
