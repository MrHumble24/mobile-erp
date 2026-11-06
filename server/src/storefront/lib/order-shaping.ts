import type {
  StorefrontOrderDetail,
  StorefrontOrderListItem,
} from '../types/storefront.types.js';

interface ProfileHolder {
  profile?: { firstName: string | null; lastName: string | null } | null;
}

export function fullName(user?: ProfileHolder | null): string | null {
  if (!user?.profile) return null;
  const parts = [user.profile.firstName, user.profile.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : null;
}

export interface RawOrderRecord {
  id: string;
  storeId: string;
  store: { name: string };
  modelId: string;
  model: { brand: string; name: string; kindCode?: string };
  specs: unknown;
  customerName: string;
  customerPhone: string;
  note: string | null;
  fulfillmentMethodCode: string;
  fulfillmentMethod?: { label: string } | null;
  address: string | null;
  deliveryZoneId: string | null;
  deliveryZone?: { name: string } | null;
  paymentMethodCode: string;
  paymentMethod?: { label: string } | null;
  priceSnapshot: { toFixed(dp: number): string } | null;
  deliveryFeeSnapshot: { toFixed(dp: number): string };
  deviceId: string | null;
  statusCode: string;
  status: { label: string };
  handledAt: Date | null;
  handledBy?: ProfileHolder | null;
  saleId: string | null;
  createdAt: Date;
  updatedAt: Date;
  statusHistory?: Array<{
    id: string;
    fromStatusCode: string | null;
    toStatusCode: string;
    toStatus: { label: string };
    changedAt: Date;
    changedBy?: ProfileHolder | null;
    note: string | null;
  }>;
}

export function toStorefrontOrderListItem(
  row: RawOrderRecord,
): StorefrontOrderListItem {
  return {
    id: row.id,
    storeId: row.storeId,
    storeName: row.store.name,
    modelId: row.modelId,
    brand: row.model.brand,
    productName: row.model.name,
    modelName: row.model.name,
    specs:
      row.specs && typeof row.specs === 'object' && !Array.isArray(row.specs)
        ? (row.specs as Record<string, unknown>)
        : {},
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    note: row.note,
    fulfillmentMethodCode: row.fulfillmentMethodCode,
    fulfillmentMethodLabel:
      row.fulfillmentMethod?.label ?? row.fulfillmentMethodCode,
    address: row.address,
    deliveryZoneId: row.deliveryZoneId,
    deliveryZoneName: row.deliveryZone?.name ?? null,
    paymentMethodCode: row.paymentMethodCode,
    paymentMethodLabel: row.paymentMethod?.label ?? row.paymentMethodCode,
    priceSnapshot:
      row.priceSnapshot != null ? Number(row.priceSnapshot).toFixed(2) : null,
    deliveryFeeSnapshot:
      row.deliveryFeeSnapshot != null
        ? Number(row.deliveryFeeSnapshot).toFixed(2)
        : '0.00',
    deviceId: row.deviceId,
    statusCode: row.statusCode,
    statusLabel: row.status.label,
    handledAt: row.handledAt,
    handledByName: fullName(row.handledBy),
    saleId: row.saleId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toStorefrontOrderDetail(
  order: RawOrderRecord,
): StorefrontOrderDetail {
  const base = toStorefrontOrderListItem(order);
  return {
    ...base,
    history: (order.statusHistory ?? []).map((h) => ({
      id: h.id,
      fromStatusCode: h.fromStatusCode,
      toStatusCode: h.toStatusCode,
      toStatusLabel: h.toStatus.label,
      changedAt: h.changedAt,
      changedByName: fullName(h.changedBy),
      note: h.note,
    })),
  };
}
