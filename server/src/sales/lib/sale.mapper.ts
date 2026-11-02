import type { ReceiptView, SaleRow, SaleView } from '../types/sale.types.js';

function fullName(
  profile: {
    firstName: string;
    lastName: string | null;
  } | null,
): string {
  if (!profile) return '';
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ');
}

function specValue(
  specs: SaleRow['device']['specs'],
  key: string,
): string | null {
  if (specs && typeof specs === 'object' && !Array.isArray(specs)) {
    const value = (specs as Record<string, unknown>)[key];
    if (typeof value === 'string') return value;
  }
  return null;
}

/** netProfit is derived here and never stored. */
export function toSaleView(row: SaleRow): SaleView {
  return {
    id: row.id,
    device: {
      imei: row.device.imei,
      model: row.device.model,
      specs: row.device.specs,
    },
    customer: row.customer,
    salePrice: row.salePrice,
    landedCostSnapshot: row.landedCostSnapshot,
    netProfit: row.salePrice.minus(row.landedCostSnapshot),
    soldAt: row.soldAt,
    soldBy: { id: row.soldBy.id, name: fullName(row.soldBy.profile) },
    warranty: row.warranty,
    consignmentId: row.consignmentId,
    notes: row.notes,
    return: row.return
      ? {
          returnedAt: row.return.returnedAt,
          refundAmount: row.return.refundAmount,
          reason: row.return.reason,
          processedBy: {
            id: row.return.processedBy.id,
            name: fullName(row.return.processedBy.profile),
          },
        }
      : null,
  };
}

/** Receipt payload for the client's thermal printer. Carries no cost fields. */
export function toReceiptView(row: SaleRow): ReceiptView {
  const model = `${row.device.model.brand} ${row.device.model.name}`;
  return {
    saleId: row.id,
    soldAt: row.soldAt,
    cashier: fullName(row.soldBy.profile),
    items: [
      {
        imei: row.device.imei,
        model,
        storage: specValue(row.device.specs, 'storage'),
        color: specValue(row.device.specs, 'color'),
        price: row.salePrice,
      },
    ],
    total: row.salePrice,
    warranty: row.warranty
      ? { days: row.warranty.days, endsAt: row.warranty.endsAt }
      : null,
    customer: row.customer
      ? { name: row.customer.name, phone: row.customer.phone }
      : undefined,
  };
}
