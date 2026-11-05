import { Prisma } from '../../generated/client/client.js';
import { ConsignmentFilters } from '../types/consignment.types.js';

/**
 * Prisma WHERE for the consignment list. `overdue` overrides any status to
 * "OUT past due"; search matches IMEI or partner shop name; from/to bound
 * consignedAt. Pure so it can be unit-tested without a database.
 */
export function buildConsignmentWhere(
  f: ConsignmentFilters,
  now: Date = new Date(),
  storeIds?: string[],
): Prisma.ConsignmentWhereInput {
  const where: Prisma.ConsignmentWhereInput = {};
  if (storeIds && storeIds.length > 0) {
    where.storeId = storeIds.length === 1 ? storeIds[0] : { in: storeIds };
  }
  if (f.partnerId) where.partnerId = f.partnerId;
  if (f.overdue) {
    where.statusCode = 'OUT';
    where.dueDate = { lt: now };
  } else if (f.statusCode) {
    where.statusCode = f.statusCode;
  }
  const term = f.search?.trim();
  if (term) {
    where.OR = [
      { device: { imei: { contains: term, mode: 'insensitive' } } },
      { device: { imei2: { contains: term, mode: 'insensitive' } } },
      { device: { serialNumber: { contains: term, mode: 'insensitive' } } },
      { partner: { shopName: { contains: term, mode: 'insensitive' } } },
    ];
  }
  if (f.from || f.to) {
    const consignedAt: Prisma.DateTimeFilter = {};
    if (f.from) consignedAt.gte = new Date(f.from);
    if (f.to) consignedAt.lte = new Date(f.to);
    where.consignedAt = consignedAt;
  }
  return where;
}
