import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { buildCustomerWhere } from './lib/customer-query.js';
import type { CustomerStats, CustomerView } from './types/customer.types.js';

const customerSelect = {
  id: true,
  name: true,
  phone: true,
  notes: true,
  createdAt: true,
} as const;

/** All Prisma access for customers. Sale aggregates are derived in the service. */
@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Full filtered customer set (no pagination — service sorts and slices). */
  findMany(search?: string, hasPurchases?: boolean): Promise<CustomerView[]> {
    return this.prisma.customer.findMany({
      where: buildCustomerWhere(search, hasPurchases),
      orderBy: { createdAt: 'desc' },
      select: customerSelect,
    });
  }

  /** Lightweight typeahead for POS checkout: top 10 name/phone matches. */
  lookup(query?: string): Promise<CustomerView[]> {
    return this.prisma.customer.findMany({
      where: buildCustomerWhere(query),
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: customerSelect,
    });
  }

  findById(id: string): Promise<CustomerView | null> {
    return this.prisma.customer.findUnique({
      where: { id },
      select: customerSelect,
    });
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

  create(data: {
    name: string;
    phone?: string;
    notes?: string;
  }): Promise<CustomerView> {
    return this.prisma.customer.create({ data, select: customerSelect });
  }

  update(
    id: string,
    data: { name?: string; phone?: string; notes?: string },
  ): Promise<CustomerView> {
    return this.prisma.customer.update({
      where: { id },
      data,
      select: customerSelect,
    });
  }
}
