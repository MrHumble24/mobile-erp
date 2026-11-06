import { Prisma } from '../../generated/client/client.js';

export function storeFilterPrisma(storeIds: string[]) {
  return storeIds.length === 1 ? storeIds[0] : { in: storeIds };
}

export function storeConditionSql(
  columnWithTable: string,
  storeIds: string[],
): Prisma.Sql {
  if (storeIds.length === 0) {
    return Prisma.sql`1=0`;
  }
  if (storeIds.length === 1) {
    return Prisma.sql`${Prisma.raw(columnWithTable)} = ${storeIds[0]}`;
  }
  return Prisma.sql`${Prisma.raw(columnWithTable)} IN (${Prisma.join(storeIds)})`;
}
