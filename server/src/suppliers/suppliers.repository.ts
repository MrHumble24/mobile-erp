import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  SupplierInput,
  SupplierPatch,
  SupplierView,
} from './types/supplier.types.js';

/** All Prisma access for suppliers. */
@Injectable()
export class SuppliersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<SupplierView[]> {
    return this.prisma.supplier.findMany({ orderBy: { name: 'asc' } });
  }

  findById(id: string): Promise<SupplierView | null> {
    return this.prisma.supplier.findUnique({ where: { id } });
  }

  create(input: SupplierInput): Promise<SupplierView> {
    return this.prisma.supplier.create({ data: input });
  }

  update(id: string, data: SupplierPatch): Promise<SupplierView> {
    return this.prisma.supplier.update({ where: { id }, data });
  }
}
