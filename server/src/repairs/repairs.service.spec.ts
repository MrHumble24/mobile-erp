import { BadRequestException, ConflictException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StoresService } from '../stores/stores.service.js';
import { RepairsReadService } from './repairs-read.service.js';
import { RepairsService } from './repairs.service.js';
import { RepairsWriteRepository } from './repairs.write.repository.js';

const caller: AuthenticatedUser = {
  id: 'u-1',
  email: 'c@x',
  permissions: new Set(['repair.manage']),
};

const D = (n: number) => new Prisma.Decimal(n);

function rawFixture(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'r-1',
    ticketNumber: 1,
    statusCode: 'READY',
    agreedPrice: D(500_000),
    payments: [{ amount: D(200_000) }],
    ...over,
  };
}

function build(raw = rawFixture()) {
  const prisma = {
    customer: { findUnique: jest.fn().mockResolvedValue({ id: 'cust-1' }) },
    deviceModel: { findUnique: jest.fn().mockResolvedValue({ id: 'm-1' }) },
  };
  const stores = { currentStoreId: jest.fn().mockResolvedValue('store-1') };
  const read = {
    assertEnabled: jest.fn().mockResolvedValue(undefined),
    require: jest.fn().mockResolvedValue(raw),
    get: jest.fn().mockResolvedValue({ id: 'r-1' }),
  };
  const writes = {
    transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn({})),
    nextTicketNumber: jest.fn().mockResolvedValue(1),
    createTicket: jest.fn().mockResolvedValue('r-1'),
    changeStatus: jest.fn().mockResolvedValue(undefined),
    updateDetails: jest.fn().mockResolvedValue(undefined),
  };
  const service = new RepairsService(
    prisma as unknown as PrismaService,
    stores as unknown as StoresService,
    read as unknown as RepairsReadService,
    writes as unknown as RepairsWriteRepository,
  );
  return { service, read, writes };
}

describe('RepairsService.create', () => {
  it('allocates a ticket number and creates the ticket', async () => {
    const { service, writes } = build();
    await service.create(caller, {
      customerId: 'cust-1',
      deviceName: 'iPhone 12',
      problem: 'screen',
      agreedPrice: 500_000,
      warrantyDays: 30,
    });
    expect(writes.createTicket).toHaveBeenCalledWith(
      {},
      1,
      expect.objectContaining({ storeId: 'store-1', customerId: 'cust-1' }),
    );
  });

  it('refuses a ticket with both an own and an outside master', async () => {
    const { service } = build();
    await expect(
      service.create(caller, {
        customerId: 'cust-1',
        deviceName: 'x',
        problem: 'y',
        agreedPrice: 1,
        warrantyDays: 0,
        masterUserId: 'u-2',
        outsideMasterName: 'Bek',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('RepairsService.changeStatus', () => {
  it('refuses an illegal move', async () => {
    const { service } = build(rawFixture({ statusCode: 'RECEIVED' }));
    await expect(
      service.changeStatus(caller, 'r-1', { toStatusCode: 'GIVEN_BACK' }),
    ).rejects.toThrow(ConflictException);
  });

  it('refuses give-back while money is owed and no reason is given', async () => {
    const { service } = build(); // READY, owed 300000
    await expect(
      service.changeStatus(caller, 'r-1', { toStatusCode: 'GIVEN_BACK' }),
    ).rejects.toThrow(ConflictException);
  });

  it('allows give-back while owed when a reason is given', async () => {
    const { service, writes } = build();
    await service.changeStatus(caller, 'r-1', {
      toStatusCode: 'GIVEN_BACK',
      note: 'Customer will pay the rest tomorrow',
    });
    expect(writes.changeStatus).toHaveBeenCalled();
  });

  it('allows give-back when fully paid', async () => {
    const { service, writes } = build(
      rawFixture({ payments: [{ amount: D(500_000) }] }),
    );
    await service.changeStatus(caller, 'r-1', { toStatusCode: 'GIVEN_BACK' });
    expect(writes.changeStatus).toHaveBeenCalled();
  });
});

describe('RepairsService.update', () => {
  it('refuses to edit a terminal ticket', async () => {
    const { service } = build(rawFixture({ statusCode: 'GIVEN_BACK' }));
    await expect(
      service.update(caller, 'r-1', { problem: 'new' }),
    ).rejects.toThrow(ConflictException);
  });
});
