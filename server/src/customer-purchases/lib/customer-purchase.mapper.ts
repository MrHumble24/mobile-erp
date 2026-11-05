import type { PurchaseRow } from '../customer-purchases.repository.js';
import type {
  CustomerPurchaseView,
  TradeInView,
} from '../types/customer-purchase.types.js';

function fullName(
  profile: {
    firstName: string;
    lastName: string | null;
  } | null,
): string {
  if (!profile) return '';
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ');
}

/** Row → list/detail view. `accountCode` comes from the ledger (null for a trade-in). */
export function toPurchaseView(
  row: PurchaseRow,
  accountCode: string | null,
): CustomerPurchaseView {
  return {
    id: row.id,
    customer: row.customer,
    unit: {
      deviceId: row.device.id,
      imei: row.device.imei,
      imei2: row.device.imei2,
      serialNumber: row.device.serialNumber,
      model: row.device.model,
    },
    pricePaid: row.pricePaid.toFixed(2),
    accountCode,
    saleId: row.saleId,
    soldBy: { id: row.createdBy.id, name: fullName(row.createdBy.profile) },
    occurredAt: row.occurredAt,
  };
}

/** Row → the trade-in shape shown on a sale / receipt (value is customer-facing). */
export function toTradeInView(row: PurchaseRow): TradeInView {
  return {
    deviceId: row.device.id,
    imei: row.device.imei,
    serialNumber: row.device.serialNumber,
    model: {
      brand: row.device.model.brand,
      name: row.device.model.name,
      kindCode: row.device.model.kindCode,
    },
    value: row.pricePaid.toFixed(2),
  };
}
