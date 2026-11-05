import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildCustomerWhere } from './lib/customer-query.js';
import type { CustomerStats, CustomerView } from './types/customer.types.js';

const customerSelect = {
  id: true,
  name: true,
  phone: true,
  notes: true,
  priceLevelCode: true,
  standingDiscountPercent: true,
  creditLimit: true,
  createdAt: true,
} as const;

interface CustomerRow {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  priceLevelCode: string;
  standingDiscountPercent: Prisma.Decimal;
  creditLimit: Prisma.Decimal | null;
  createdAt: Date;
}

function toView(row: CustomerRow): CustomerView {
  return {
    ...row,
    standingDiscountPercent: row.standingDiscountPercent.toFixed(2),
    creditLimit: row.creditLimit === null ? null : row.creditLimit.toFixed(2),
  };
}

/** Fields a create/update may write (undefined = leave unchanged). */
export interface CustomerWrite {
  name?: string;
  phone?: string;
  notes?: string;
  priceLevelCode?: string;
  standingDiscountPercent?: number;
  creditLimit?: number | null;
}

/** All Prisma access for customers. Sale aggregates are derived in the service. */
@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Full filtered customer set (no pagination — service sorts and slices). */
  async findMany(
    search?: string,
    hasPurchases?: boolean,
  ): Promise<CustomerView[]> {
    const rows = await this.prisma.customer.findMany({
      where: buildCustomerWhere(search, hasPurchases),
      orderBy: { createdAt: 'desc' },
      select: customerSelect,
    });
    return rows.map(toView);
  }

  /** Lightweight typeahead for POS checkout: top 10 name/phone matches. */
  async lookup(query?: string): Promise<CustomerView[]> {
    const rows = await this.prisma.customer.findMany({
      where: buildCustomerWhere(query),
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: customerSelect,
    });
    return rows.map(toView);
  }

  async findById(id: string): Promise<CustomerView | null> {
    const row = await this.prisma.customer.findUnique({
      where: { id },
      select: customerSelect,
    });
    return row ? toView(row) : null;
  }

  findByPhone(phone: string): Promise<{ id: string } | null> {
    return this.prisma.customer.findUnique({
      where: { phone },
      select: { id: true },
    });
  }

  /** Directory summary. Reads each customer's own `sales` relation count only. */
  async stats(): Promise<CustomerStats> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const rows = await this.prisma.customer.findMany({
      select: { createdAt: true, _count: { select: { sales: true } } },
    });

    let withPurchases = 0;
    let repeatBuyers = 0;
    let newThisMonth = 0;
    for (const row of rows) {
      if (row._count.sales > 0) withPurchases += 1;
      if (row._count.sales > 1) repeatBuyers += 1;
      if (row.createdAt >= monthStart) newThisMonth += 1;
    }
    return { total: rows.length, newThisMonth, withPurchases, repeatBuyers };
  }

  async create(data: CustomerWrite & { name: string }): Promise<CustomerView> {
    const row = await this.prisma.customer.create({
      data,
      select: customerSelect,
    });
    return toView(row);
  }

  async update(id: string, data: CustomerWrite): Promise<CustomerView> {
    const row = await this.prisma.customer.update({
      where: { id },
      data,
      select: customerSelect,
    });
    return toView(row);
  }
}
