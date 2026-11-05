import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { StoreIdentity } from './types/store.types.js';

/** All Prisma access for the stores table (one store today). */
@Injectable()
export class StoresRepository {
  constructor(private readonly prisma: PrismaService) {}

  async currentId(): Promise<string> {
    const row = await this.prisma.store.findFirstOrThrow({
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    return row.id;
  }

  getIdentity(): Promise<StoreIdentity> {
    return this.prisma.store.findFirstOrThrow({
      select: { name: true, address: true, phone: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateIdentity(
    id: string,
    data: Partial<StoreIdentity>,
  ): Promise<void> {
    await this.prisma.store.update({ where: { id }, data });
  }
}
