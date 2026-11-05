import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LedgerFilter, LedgerPost } from './types/ledger.types.js';

type Tx = Prisma.TransactionClient;

const LIST_INCLUDE = {
  account: { select: { code: true, label: true } },
  type: { select: { code: true, label: true } },
  createdBy: {
    select: {
      id: true,
      email: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.CashTransactionInclude;

/** All Prisma access for the ledger. The ledger is append-only: no update/delete. */
@Injectable()
export class LedgerRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Append one signed row. Pass `tx` to post inside a caller's transaction so a
   * sale and its ledger rows commit atomically (2b); omit it for a standalone
   * manual entry.
   */
  create(post: LedgerPost, tx?: Tx) {
    return (tx ?? this.prisma).cashTransaction.create({
      data: post,
      include: LIST_INCLUDE,
    });
  }

  /** The two rows of a transfer, written atomically. */
  createTransfer(from: LedgerPost, to: LedgerPost) {
    return this.prisma.$transaction(async (tx) => {
      await this.create(from, tx);
      return this.create(to, tx);
    });
  }

  async findMany(filter: LedgerFilter) {
    const where = this.toWhere(filter);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.cashTransaction.findMany({
        where,
        include: LIST_INCLUDE,
        orderBy: { [filter.sort]: filter.dir },
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
      }),
      this.prisma.cashTransaction.count({ where }),
    ]);
    return { items, total };
  }

  sumByAccount(storeId: string) {
    return this.prisma.cashTransaction.groupBy({
      by: ['accountCode'],
      where: { storeId },
      _sum: { amount: true },
    });
  }

  listAccounts() {
    return this.prisma.cashAccount.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { code: true, label: true },
    });
  }

  accountExists(code: string) {
    return this.prisma.cashAccount.findFirst({
      where: { code, isActive: true },
      select: { code: true },
    });
  }

  openingExists(storeId: string, accountCode: string) {
    return this.prisma.cashTransaction.findFirst({
      where: { storeId, accountCode, typeCode: 'OPENING' },
      select: { id: true },
    });
  }

  toWhere(filter: LedgerFilter): Prisma.CashTransactionWhereInput {
    return {
      storeId: filter.storeId,
      accountCode: filter.accountCode,
      typeCode: filter.typeCode,
      occurredAt:
        filter.from || filter.to
          ? { gte: filter.from, lte: filter.to }
          : undefined,
    };
  }
}
