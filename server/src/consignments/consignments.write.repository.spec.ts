import { ConflictException } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConsignmentsWriteRepository } from './consignments.write.repository.js';

const D = (n: number) => new Prisma.Decimal(n);

function makeTx() {
  return {
    device: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    deviceStatusHistory: { create: jest.fn().mockResolvedValue({}) },
    consignment: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    sale: { create: jest.fn().mockResolvedValue({}) },
  };
}

function build(tx: ReturnType<typeof makeTx>) {
  const prisma = {
    $transaction: (fn: (t: unknown) => unknown) => fn(tx),
  };
  return new ConsignmentsWriteRepository(prisma as unknown as PrismaService);
}

const transfer = {
  storeId: 'store-1',
  imei: '123456789012345',
  partnerId: 'p1',
  agreedPrice: D(500),
  dueDate: new Date('2026-12-01'),
  createdById: 'u1',
};

describe('ConsignmentsWriteRepository.createTransfer', () => {
  it('rejects a device that is not IN_STOCK and writes nothing', async () => {
    const tx = makeTx();
    tx.device.findFirst.mockResolvedValue({
      id: 'd1',
      statusCode: 'CONSIGNED',
      version: 0,
      landedCost: D(100),
    });
    await expect(build(tx).createTransfer(transfer)).rejects.toThrow(
      ConflictException,
    );
    expect(tx.device.updateMany).not.toHaveBeenCalled();
    expect(tx.consignment.create).not.toHaveBeenCalled();
  });

  it('flips the device to CONSIGNED under the optimistic lock and logs history', async () => {
    const tx = makeTx();
    tx.device.findFirst.mockResolvedValue({
      id: 'd1',
      statusCode: 'IN_STOCK',
      version: 3,
      landedCost: D(100),
    });
    tx.consignment.create.mockResolvedValue({
      id: 'c1',
      partnerId: 'p1',
      deviceId: 'd1',
      device: { imei: transfer.imei },
      partner: { shopName: 'Shop A' },
      sale: null,
      agreedPrice: D(500),
      dueDate: transfer.dueDate,
      statusCode: 'OUT',
      consignedAt: new Date(),
      resolvedAt: null,
      notes: null,
      createdById: 'u1',
      createdAt: new Date(),
    });
    await build(tx).createTransfer({ ...transfer, expectedVersion: 3 });
    expect(tx.device.updateMany).toHaveBeenCalledWith({
      where: { id: 'd1', version: 3 },
      data: { statusCode: 'CONSIGNED', version: { increment: 1 } },
    });
    expect(tx.deviceStatusHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fromStatusCode: 'IN_STOCK',
        toStatusCode: 'CONSIGNED',
        reason: 'consignment',
      }),
    });
  });

  it('rejects a stale expectedVersion', async () => {
    const tx = makeTx();
    tx.device.findFirst.mockResolvedValue({
      id: 'd1',
      statusCode: 'IN_STOCK',
      version: 5,
      landedCost: D(100),
    });
    await expect(
      build(tx).createTransfer({ ...transfer, expectedVersion: 4 }),
    ).rejects.toThrow(ConflictException);
    expect(tx.device.updateMany).not.toHaveBeenCalled();
  });

  it('409s when the optimistic update matches no row', async () => {
    const tx = makeTx();
    tx.device.findFirst.mockResolvedValue({
      id: 'd1',
      statusCode: 'IN_STOCK',
      version: 0,
      landedCost: D(100),
    });
    tx.device.updateMany.mockResolvedValue({ count: 0 });
    await expect(build(tx).createTransfer(transfer)).rejects.toThrow(
      ConflictException,
    );
    expect(tx.consignment.create).not.toHaveBeenCalled();
  });
});

describe('ConsignmentsWriteRepository.settle', () => {
  it('rejects settling a consignment that is not OUT', async () => {
    const tx = makeTx();
    tx.consignment.findUnique.mockResolvedValue({
      statusCode: 'SETTLED',
      agreedPrice: D(500),
      device: { id: 'd1', statusCode: 'SOLD', version: 1, landedCost: D(100) },
    });
    await expect(
      build(tx).settle('c1', { storeId: 'store-1', soldById: 'u1' }),
    ).rejects.toThrow(ConflictException);
    expect(tx.sale.create).not.toHaveBeenCalled();
  });

  it('snapshots landed cost and defaults salePrice to agreedPrice', async () => {
    const tx = makeTx();
    tx.consignment.findUnique.mockResolvedValue({
      statusCode: 'OUT',
      agreedPrice: D(500),
      device: {
        id: 'd1',
        statusCode: 'CONSIGNED',
        version: 1,
        landedCost: D(120),
      },
    });
    tx.consignment.update.mockResolvedValue({
      id: 'c1',
      partnerId: 'p1',
      deviceId: 'd1',
      device: { imei: transfer.imei },
      partner: { shopName: 'Shop A' },
      sale: null,
      agreedPrice: D(500),
      dueDate: transfer.dueDate,
      statusCode: 'SETTLED',
      consignedAt: new Date(),
      resolvedAt: new Date(),
      notes: null,
      createdById: 'u1',
      createdAt: new Date(),
    });
    await build(tx).settle('c1', { storeId: 'store-1', soldById: 'u1' });
    expect(tx.sale.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        salePrice: D(500),
        landedCostSnapshot: D(120),
        consignmentId: 'c1',
      }),
    });
  });
});
