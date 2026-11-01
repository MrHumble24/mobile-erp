/** Prisma Decimal (or null from an empty aggregate) → a plain JS number. */
export const toNumber = (value: unknown): number => Number(value ?? 0);
