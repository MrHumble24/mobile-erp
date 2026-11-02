import type { Prisma } from '../../generated/client/client.js';

export type CustomerSort = 'recent' | 'name';

/**
 * Builds the Prisma `where` for the customer list: insensitive name/phone
 * substring match plus an optional "has any purchase" filter (via the
 * customer's own `sales` relation, never a sale-table read).
 */
export function buildCustomerWhere(
  search?: string,
  hasPurchases?: boolean,
): Prisma.CustomerWhereInput {
  const and: Prisma.CustomerWhereInput[] = [];

  const term = search?.trim();
  if (term) {
    and.push({
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term, mode: 'insensitive' } },
      ],
    });
  }
  if (hasPurchases === true) and.push({ sales: { some: {} } });
  if (hasPurchases === false) and.push({ sales: { none: {} } });

  return and.length ? { AND: and } : {};
}

/** Sorts customers in place: by name (A→Z) or by most recent purchase first. */
export function sortCustomers<
  T extends { name: string; lastPurchaseAt: Date | null },
>(items: T[], sort: CustomerSort): void {
  if (sort === 'name') {
    items.sort((a, b) => a.name.localeCompare(b.name));
    return;
  }
  items.sort(
    (a, b) =>
      (b.lastPurchaseAt?.getTime() ?? 0) - (a.lastPurchaseAt?.getTime() ?? 0),
  );
}
