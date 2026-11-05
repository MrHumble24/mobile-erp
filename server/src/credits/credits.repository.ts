import { Injectable } from '@nestjs/common';
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
   * overdue), for the credit-limit gate. Exact, in two aggregates.
   */
  async customerOutstanding(customerId: string): Promise<Prisma.Decimal> {
    const [sales, payments] = await this.prisma.$transaction([
      this.prisma.sale.aggregate({
        where: { credit: { customerId }, return: { is: null } },
        _sum: { salePrice: true },
      }),
      this.prisma.creditPayment.aggregate({
        where: { credit: { customerId } },
        _sum: { amount: true },
      }),
    ]);
    const sold = sales._sum.salePrice ?? new Prisma.Decimal(0);
    const paid = payments._sum.amount ?? new Prisma.Decimal(0);
    return sold.minus(paid);
  }

  findRawById(id: string): Promise<CreditRaw | null> {
    return this.prisma.customerCredit.findUnique({
      where: { id },
      include: creditInclude,
    });
  }

  findRawByClientKey(clientKey: string): Promise<CreditRaw | null> {
    return this.prisma.customerCredit.findUnique({
      where: { clientKey },
      include: creditInclude,
    });
  }

  listRaw(customerId?: string): Promise<CreditRaw[]> {
    return this.prisma.customerCredit.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: creditInclude,
    });
  }
}
