import type { Prisma } from '../../generated/client/client.js';
import type { SaleFilters } from '../types/sale.types.js';

function soldAtRange(
  from?: string,
  to?: string,
): Prisma.SaleWhereInput['soldAt'] {
  if (!from && !to) return undefined;
  return {
    gte: from ? new Date(from) : undefined,
    lte: to ? new Date(to) : undefined,
  };
}

function consignmentFilter(
  channel: SaleFilters['channel'],
): Prisma.SaleWhereInput['consignmentId'] {
  if (channel === 'retail') return null;
  if (channel === 'b2b') return { not: null };
  return undefined;
}

function searchOr(search?: string): Prisma.SaleWhereInput['OR'] {
  const term = search?.trim();
  if (!term) return undefined;
  return [
    // Unit sale: IMEI, second IMEI or serial number (the three unit codes, ADR 0029).
    { device: { imei: { contains: term } } },
    { device: { imei2: { contains: term } } },
    { device: { serialNumber: { contains: term, mode: 'insensitive' } } },
    // Quantity sale: no unit, identified by its product's name/barcode/model code.
    { model: { name: { contains: term, mode: 'insensitive' } } },
    { model: { barcode: { contains: term, mode: 'insensitive' } } },
    { model: { modelCode: { contains: term, mode: 'insensitive' } } },
    { customer: { name: { contains: term, mode: 'insensitive' } } },
    { customer: { phone: { contains: term, mode: 'insensitive' } } },
  ];
}

/**
 * Single source of truth for the `sales` WHERE clause, shared by list and
 * stats. `warranty: 'active'` implies "not returned" (a returned unit is no
 * longer under active cover).
 */
export function buildSaleWhere(
  filters: SaleFilters,
  storeIds?: string[],
): Prisma.SaleWhereInput {
  const now = new Date();
  const where: Prisma.SaleWhereInput = {
    soldById: filters.soldById,
    customerId: filters.customerId,
    soldAt: soldAtRange(filters.from, filters.to),
    consignmentId: consignmentFilter(filters.channel),
  };

  if (storeIds && storeIds.length > 0) {
    where.storeId = storeIds.length === 1 ? storeIds[0] : { in: storeIds };
  }

  const or = searchOr(filters.search);
  if (or) where.OR = or;

  if (filters.returned === 'true') where.return = { isNot: null };
  else if (filters.returned === 'false') where.return = { is: null };

  if (filters.warranty === 'active') {
    where.warranty = { endsAt: { gt: now } };
    where.return = { is: null };
  } else if (filters.warranty === 'expired') {
    where.warranty = { endsAt: { lte: now } };
  }

  return where;
}
