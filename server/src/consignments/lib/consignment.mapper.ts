import { Prisma } from '../../generated/client/client.js';
import { ConsignmentView } from '../types/consignment.types.js';

/** Shape every repository selects so it can map to a ConsignmentView. */
export interface ConsignmentRow {
  id: string;
  partnerId: string;
  partner: { shopName: string };
  deviceId: string;
  device: { imei: string; imei2: string | null };
  agreedPrice: Prisma.Decimal;
  dueDate: Date;
  statusCode: string;
  consignedAt: Date;
  resolvedAt: Date | null;
  notes: string | null;
  sale: { id: string } | null;
  createdById: string;
  createdAt: Date;
}

/** Include every relation a ConsignmentView needs (imei, partner, resulting sale). */
export const withImei = {
  device: { select: { imei: true, imei2: true } },
  partner: { select: { shopName: true } },
  sale: { select: { id: true } },
} as const;

export function toConsignmentView(row: ConsignmentRow): ConsignmentView {
  return {
    id: row.id,
    partnerId: row.partnerId,
    partnerShopName: row.partner.shopName,
    deviceId: row.deviceId,
    imei: row.device.imei,
    imei2: row.device.imei2,
    agreedPrice: row.agreedPrice,
    dueDate: row.dueDate,
    statusCode: row.statusCode,
    consignedAt: row.consignedAt,
    resolvedAt: row.resolvedAt,
    notes: row.notes,
    saleId: row.sale?.id ?? null,
    createdById: row.createdById,
    createdAt: row.createdAt,
  };
}
