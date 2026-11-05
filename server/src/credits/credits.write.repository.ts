import { Injectable } from '@nestjs/common';
import type { PrismaTx as CreditTx } from '../common/types/prisma-tx.js';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

export type { CreditTx };

/** The Prisma writes for a credit. The service drives the transaction so the
 * sale checkouts and ledger rows commit atomically with the credit rows. */
@Injectable()
export class CreditsWriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** One interactive transaction the service fills with every credit write. */
  transaction<T>(fn: (tx: CreditTx) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  async createCredit(
    tx: CreditTx,
    data: {
      storeId: string;
      customerId: string;
      createdById: string;
      note?: string;
      clientKey?: string;
    },
  ): Promise<string> {
    const credit = await tx.customerCredit.create({
      data,
      select: { id: true },
    });
    return credit.id;
  }

  async createInstalments(
    tx: CreditTx,
    creditId: string,
    rows: { dueDate: Date; amount: Prisma.Decimal }[],
  ): Promise<void> {
    await tx.creditInstalment.createMany({
      data: rows.map((r) => ({
        creditId,
        dueDate: r.dueDate,
        amount: r.amount,
      })),
    });
  }

  async createPayment(
    tx: CreditTx,
    data: {
      creditId: string;
      accountCode: string;
      amount: Prisma.Decimal;
      receivedById: string;
      occurredAt: Date;
    },
  ): Promise<string> {
    const payment = await tx.creditPayment.create({
      data,
      select: { id: true },
    });
    return payment.id;
  }
}
