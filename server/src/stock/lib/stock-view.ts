import { Prisma } from '../../generated/client/client.js';
import type { ResolvedPrices } from '../../pricing/types/pricing.types.js';
import { valuation } from './stock-math.js';
import type {
  StockLevelRow,
  StockLevelView,
  StockMovementView,
} from '../types/stock.types.js';

/** Raw movement row shape the repository selects for the movements list. */
export interface MovementRow {
  id: string;
  quantity: number;
  unitCostSnapshot: Prisma.Decimal;
  shipmentId: string | null;
  saleId: string | null;
  note: string | null;
  occurredAt: Date;
  type: { code: string; label: string };
  createdBy: {
    id: string;
    profile: { firstName: string; lastName: string | null } | null;
  } | null;
}

export function toLevelView(
  row: StockLevelRow,
  canViewCost: boolean,
  prices: ResolvedPrices,
): StockLevelView {
  const v = valuation({
    quantity: Number(row.quantity),
    value: new Prisma.Decimal(row.value),
    latestPurchaseCost: new Prisma.Decimal(row.latestPurchaseCost),
  });
  return {
    modelId: row.modelId,
    brand: row.brand,
    name: row.name,
    barcode: row.barcode,
    modelCode: row.modelCode,
    categoryId: row.categoryId,
    salePrice:
      row.salePrice === null
        ? null
        : new Prisma.Decimal(row.salePrice).toFixed(2),
    quantity: v.quantity,
    averageCost: canViewCost ? v.averageCost.toFixed(2) : null,
    value: canViewCost ? v.value.toFixed(2) : null,
    prices,
  };
}

export function toMovementView(
  m: MovementRow,
  canViewCost: boolean,
): StockMovementView {
  const p = m.createdBy?.profile;
  return {
    id: m.id,
    typeCode: m.type.code,
    typeLabel: m.type.label,
    quantity: m.quantity,
    unitCostSnapshot: canViewCost ? m.unitCostSnapshot.toFixed(2) : null,
    shipmentId: m.shipmentId,
    saleId: m.saleId,
    note: m.note,
    occurredAt: m.occurredAt,
    createdBy: m.createdBy
      ? {
          id: m.createdBy.id,
          name: p ? `${p.firstName} ${p.lastName ?? ''}`.trim() : '',
        }
      : null,
  };
}
