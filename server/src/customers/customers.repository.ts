import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CustomerView } from './types/customer.types.js';

const customerSelect = {
  id: true,
  name: true,
  phone: true,
  notes: true,
  createdAt: true,
} as const;

/** All Prisma access for customers. */
@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Lists customers, optionally filtered by a name/phone substring. */
  search(query?: string): Promise<CustomerView[]> {
    const where = query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' as const } },
            { phone: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : undefined;
    return this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: customerSelect,
    });
  }

  findById(id: string): Promise<CustomerView | null> {
    return this.prisma.customer.findUnique({
      where: { id },
      select: customerSelect,
    });
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
