import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/** All Prisma access for the secrets table. Values are opaque sealed blobs. */
@Injectable()
export class SecretsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(name: string, sealed: Buffer): Promise<void> {
    // Prisma Bytes wants a Uint8Array over a plain ArrayBuffer; copy to satisfy it.
    const bytes = new Uint8Array(sealed);
    await this.prisma.secret.upsert({
      where: { name },
      create: { name, sealed: bytes },
      update: { sealed: bytes },
    });
  }

  async getSealed(name: string): Promise<Buffer | null> {
    const row = await this.prisma.secret.findUnique({
      where: { name },
      select: { sealed: true },
    });
    return row ? Buffer.from(row.sealed) : null;
  }

  async exists(name: string): Promise<boolean> {
    const row = await this.prisma.secret.findUnique({
      where: { name },
      select: { name: true },
    });
    return row !== null;
  }

  async delete(name: string): Promise<void> {
    await this.prisma.secret.deleteMany({ where: { name } });
  }
}
