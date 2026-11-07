import { ConflictException } from '@nestjs/common';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  REPAIR_VERSION_CONFLICT,
  RepairsWriteRepository,
} from './repairs.write.repository.js';

function build(updateCount = 1) {
  const tx = {
    repair: {
      updateMany: jest.fn().mockResolvedValue({ count: updateCount }),
    },
    repairStatusHistory: { create: jest.fn().mockResolvedValue({}) },
    repairPart: {
      create: jest.fn().mockResolvedValue({ id: 'part-1' }),
      delete: jest.fn().mockResolvedValue({}),
    },
    repairPayment: { create: jest.fn().mockResolvedValue({ id: 'pay-1' }) },
    repairMutation: { create: jest.fn().mockResolvedValue({}) },
  };
  const prisma = {
    repairMutation: { findUnique: jest.fn().mockResolvedValue(null) },
  };
  const repo = new RepairsWriteRepository(prisma as unknown as PrismaService);
  return { repo, tx, prisma };
}

const asTx = (tx: unknown) => tx as unknown as PrismaTx;

describe('RepairsWriteRepository.bumpVersion (optimistic lock)', () => {
  it('updates only the row at the expected version and bumps it', async () => {
    const { repo, tx } = build(1);
    await repo.bumpVersion(asTx(tx), 'r-1', 3, { problem: 'changed' });
    expect(tx.repair.updateMany).toHaveBeenCalledWith({
      where: { id: 'r-1', version: 3 },
      data: { problem: 'changed', version: { increment: 1 } },
    });
  });

  it('throws a coded REPAIR_VERSION_CONFLICT when a concurrent write won', async () => {
    const { repo, tx } = build(0);
    let error: unknown;
    try {
      await repo.bumpVersion(asTx(tx), 'r-1', 3);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toMatchObject({
      code: REPAIR_VERSION_CONFLICT,
    });
  });
});

describe('RepairsWriteRepository mutation keys', () => {
  it('finds the repair id recorded for a key', async () => {
    const { repo, prisma } = build();
    prisma.repairMutation.findUnique.mockResolvedValue({ repairId: 'r-5' });
    await expect(repo.findMutationRepairId('k-1')).resolves.toBe('r-5');
    expect(prisma.repairMutation.findUnique).toHaveBeenCalledWith({
      where: { clientMutationId: 'k-1' },
      select: { repairId: true },
    });
  });

  it('returns null for an unknown key', async () => {
    const { repo } = build();
    await expect(repo.findMutationRepairId('k-new')).resolves.toBeNull();
  });

  it('inserts the key inside the write transaction', async () => {
    const { repo, tx } = build();
    await repo.recordMutation(asTx(tx), 'k-1', 'r-1', 'payment');
    expect(tx.repairMutation.create).toHaveBeenCalledWith({
      data: { clientMutationId: 'k-1', repairId: 'r-1', kind: 'payment' },
    });
  });
});
