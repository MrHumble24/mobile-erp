import { Injectable } from '@nestjs/common';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const creditInclude = {
  customer: { select: { id: true, name: true, phone: true } },
  createdBy: {
    select: {
      id: true,
      profile: { select: { firstName: true, lastName: true } },
    },
  },
  sales: {
    orderBy: { soldAt: 'asc' },
    select: {
      id: true,
      salePrice: true,
      quantity: true,
      device: {
        select: {
          imei: true,
          serialNumber: true,
          model: { select: { brand: true, name: true } },
        },
      },
      model: { select: { brand: true, name: true } },
      return: { select: { returnedAt: true } },
    },
  },
  instalments: {
    orderBy: { dueDate: 'asc' },
    select: { id: true, dueDate: true, amount: true },
  },
  payments: {
    orderBy: { occurredAt: 'asc' },
    select: {
      id: true,
      accountCode: true,
      amount: true,
      occurredAt: true,
      receivedBy: {
        select: {
          id: true,
          profile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  },
} satisfies Prisma.CustomerCreditInclude;

export type CreditRaw = Prisma.CustomerCreditGetPayload<{
  include: typeof creditInclude;
}>;

/** Read-side Prisma access for customer credit. Writes live in the write repo. */
@Injectable()
export class CreditsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Just the fields the credit gate needs: phone (required) and own limit. */
  customerForCredit(id: string): Promise<{
    id: string;
    phone: string | null;
    creditLimit: Prisma.Decimal | null;
  } | null> {
    return this.prisma.customer.findUnique({
      where: { id },
      select: { id: true, phone: true, creditLimit: true },
    });
  }

  /**
   * The customer's total outstanding across all their credits:
   * Σ sale price of not-returned sales − Σ payments. Pure outstanding (no
   * overdue), for the credit-limit gate. Pass the write `tx` so the read runs
   * after a `FOR UPDATE` lock on the customer and two concurrent credits cannot
   * both pass the limit (ADR 0028).
   */
  async customerOutstanding(
    customerId: string,
    client: PrismaTx | PrismaService = this.prisma,
  ): Promise<Prisma.Decimal> {
    const sales = await client.sale.aggregate({
      where: { credit: { customerId }, return: { is: null } },
      _sum: { salePrice: true },
    });
    const payments = await client.creditPayment.aggregate({
      where: { credit: { customerId } },
      _sum: { amount: true },
    });
    const sold = sales._sum.salePrice ?? new Prisma.Decimal(0);
    const paid = payments._sum.amount ?? new Prisma.Decimal(0);
    return sold.minus(paid);
  }

  findRawById(
    id: string,
    client: PrismaTx | PrismaService = this.prisma,
    storeIds?: string[],
  ): Promise<CreditRaw | null> {
    const where: Prisma.CustomerCreditWhereInput = {
      id,
      ...(storeIds?.length ? { storeId: { in: storeIds } } : {}),
    };
    return client.customerCredit.findFirst({
      where,
      include: creditInclude,
    });
  }

  /** Lock one customer row (FOR UPDATE) so concurrent credits serialize. */
  async lockCustomer(tx: PrismaTx, customerId: string): Promise<void> {
    await tx.$queryRaw`SELECT id FROM customers WHERE id = ${customerId} FOR UPDATE`;
  }

  /** Lock one credit row (FOR UPDATE) so concurrent payments serialize. */
  async lockCredit(tx: PrismaTx, creditId: string): Promise<void> {
    await tx.$queryRaw`SELECT id FROM customer_credits WHERE id = ${creditId} FOR UPDATE`;
  }

  findRawByClientKey(clientKey: string): Promise<CreditRaw | null> {
    return this.prisma.customerCredit.findUnique({
      where: { clientKey },
      include: creditInclude,
    });
  }

  listRaw(storeIds?: string[], customerId?: string): Promise<CreditRaw[]> {
    const where: Prisma.CustomerCreditWhereInput = {
      ...(customerId ? { customerId } : {}),
      ...(storeIds?.length ? { storeId: { in: storeIds } } : {}),
    };
    return this.prisma.customerCredit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: creditInclude,
    });
  }
}
