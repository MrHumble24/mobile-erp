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

function specValue(specs: unknown, key: string): string | null {
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
    device: row.device
      ? {
          imei: row.device.imei,
          imei2: row.device.imei2,
          serialNumber: row.device.serialNumber,
          model: row.device.model,
          specs: row.device.specs,
        }
      : null,
    model: row.model,
    quantity: row.quantity,
    customer: row.customer,
    salePrice: row.salePrice,
    landedCostSnapshot: row.landedCostSnapshot,
    netProfit: row.salePrice.minus(row.landedCostSnapshot),
    listPrice: row.listPriceSnapshot,
    discountAmount:
      row.listPriceSnapshot === null
        ? null
        : row.listPriceSnapshot.minus(row.salePrice),
    priceLevelCode: row.priceLevelCode,
    soldAt: row.soldAt,
    soldBy: { id: row.soldBy.id, name: fullName(row.soldBy.profile) },
    warranty: row.warranty,
    consignmentId: row.consignmentId,
    notes: row.notes,
    payments: [],
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
  const ref = row.device?.model ?? row.model;
  const model = ref ? `${ref.brand} ${ref.name}` : '';
  return {
    saleId: row.id,
    soldAt: row.soldAt,
    cashier: fullName(row.soldBy.profile),
    items: [
      {
        imei: row.device?.imei ?? null,
        imei2: row.device?.imei2 ?? null,
        serialNumber: row.device?.serialNumber ?? null,
        model,
        storage: row.device ? specValue(row.device.specs, 'storage') : null,
        color: row.device ? specValue(row.device.specs, 'color') : null,
        quantity: row.quantity,
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
    payments: [], // filled by the service from the sale's SALE ledger rows
  };
}
