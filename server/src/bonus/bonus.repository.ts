import { Injectable } from '@nestjs/common';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { BonusHistoryRow } from './types/bonus.types.js';

const ZERO = new Prisma.Decimal(0);

/** One points movement to append (service builds it; never touched elsewhere). */
export interface BonusPost {
  storeId: string;
  customerId: string;
  typeCode: string;
  amount: Prisma.Decimal;
  saleId?: string | null;
  note?: string | null;
  occurredAt?: Date;
  createdById: string;
}

const historySelect = {
  id: true,
  typeCode: true,
  amount: true,
  occurredAt: true,
  note: true,
  saleId: true,
  createdBy: {
    select: {
      id: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
} as const;

/** All Prisma access for the bonus-point ledger. A balance is always a SUM. */
@Injectable()
export class BonusRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The signed sum of one customer's rows in a store. */
  async balance(storeId: string, customerId: string): Promise<Prisma.Decimal> {
    const r = await this.prisma.bonusTransaction.aggregate({
      where: { storeId, customerId },
      _sum: { amount: true },
    });
    return r._sum.amount ?? ZERO;
  }

  /** Balances for many customers at once (POS customer search). */
  async balancesFor(
    storeId: string,
    customerIds: string[],
  ): Promise<Map<string, Prisma.Decimal>> {
    if (customerIds.length === 0) return new Map();
    const rows = await this.prisma.bonusTransaction.groupBy({
      by: ['customerId'],
      where: { storeId, customerId: { in: customerIds } },
      _sum: { amount: true },
    });
    const map = new Map<string, Prisma.Decimal>();
    for (const r of rows) map.set(r.customerId, r._sum.amount ?? ZERO);
    return map;
  }

  async history(
    storeId: string,
    customerId: string,
  ): Promise<BonusHistoryRow[]> {
    const rows = await this.prisma.bonusTransaction.findMany({
      where: { storeId, customerId },
      orderBy: { occurredAt: 'desc' },
      select: historySelect,
    });
    return rows.map((r) => ({
      id: r.id,
      typeCode: r.typeCode,
      amount: r.amount.toFixed(2),
      occurredAt: r.occurredAt,
      note: r.note,
      saleId: r.saleId,
      createdBy: r.createdBy
        ? {
            id: r.createdBy.id,
            name: fullName(r.createdBy.profile),
          }
        : null,
    }));
  }

  /** Points earned and spent per sale (magnitudes), for the sale/receipt views. */
  async summaryBySale(
    saleIds: string[],
  ): Promise<Map<string, { earned: Prisma.Decimal; spent: Prisma.Decimal }>> {
    const map = new Map<
      string,
      { earned: Prisma.Decimal; spent: Prisma.Decimal }
    >();
    if (saleIds.length === 0) return map;
    const rows = await this.prisma.bonusTransaction.groupBy({
      by: ['saleId', 'typeCode'],
      where: { saleId: { in: saleIds }, typeCode: { in: ['EARN', 'SPEND'] } },
      _sum: { amount: true },
    });
    for (const r of rows) {
      if (!r.saleId) continue;
      const e = map.get(r.saleId) ?? { earned: ZERO, spent: ZERO };
      const amount = r._sum.amount ?? ZERO;
      if (r.typeCode === 'EARN') e.earned = amount;
      else e.spent = amount.negated(); // SPEND is stored negative
      map.set(r.saleId, e);
    }
    return map;
  }

  /** The EARN/SPEND rows a sale posted, for a return to reverse (ADR 0043). */
  saleRows(
    tx: PrismaTx,
    saleId: string,
  ): Promise<{ typeCode: string; amount: Prisma.Decimal }[]> {
    return tx.bonusTransaction.findMany({
      where: { saleId, typeCode: { in: ['EARN', 'SPEND'] } },
      select: { typeCode: true, amount: true },
    });
  }

  /** Append one row, in the caller's transaction when money/stock must commit as one. */
  async post(entry: BonusPost, tx?: PrismaTx): Promise<void> {
    const client = tx ?? this.prisma;
    await client.bonusTransaction.create({
      data: {
        storeId: entry.storeId,
        customerId: entry.customerId,
        typeCode: entry.typeCode,
        amount: entry.amount,
        saleId: entry.saleId ?? null,
        note: entry.note ?? null,
        occurredAt: entry.occurredAt ?? new Date(),
        createdById: entry.createdById,
      },
    });
  }
}

function fullName(
  profile: { firstName: string; lastName: string | null } | null,
): string {
  if (!profile) return '';
  return [profile.firstName, profile.lastName].filter(Boolean).join(' ');
}
