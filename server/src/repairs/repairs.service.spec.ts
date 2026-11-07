import { BadRequestException, ConflictException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StoresService } from '../stores/stores.service.js';
import { RepairIdempotency } from './repair-idempotency.service.js';
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
    version: 1,
    agreedPrice: D(500_000),
    payments: [{ amount: D(200_000) }],
    ...over,
  };
}

function build(raw = rawFixture()) {
  const tx = {
    customer: {
      findUnique: jest.fn().mockResolvedValue({ id: 'cust-1' }),
      upsert: jest.fn().mockResolvedValue({ id: 'cust-1' }),
      create: jest.fn().mockResolvedValue({ id: 'cust-1' }),
    },
  };
  const prisma = {
    customer: { findUnique: jest.fn().mockResolvedValue({ id: 'cust-1' }) },
    deviceModel: { findUnique: jest.fn().mockResolvedValue({ id: 'm-1' }) },
    user: { findUnique: jest.fn().mockResolvedValue({ id: 'u-2' }) },
    device: { findFirst: jest.fn().mockResolvedValue({ id: 'd-1' }) },
  };
  const stores = { currentStoreId: jest.fn().mockResolvedValue('store-1') };
  const read = {
    assertEnabled: jest.fn().mockResolvedValue(undefined),
    require: jest.fn().mockResolvedValue(raw),
    get: jest.fn().mockResolvedValue({ id: 'r-1' }),
  };
  const writes = {
    transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(tx)),
    nextTicketNumber: jest.fn().mockResolvedValue(1),
    createTicket: jest.fn().mockResolvedValue('r-1'),
    changeStatus: jest.fn().mockResolvedValue(undefined),
    updateDetails: jest.fn().mockResolvedValue(undefined),
  };
  const idem = {
    replay: jest.fn().mockResolvedValue(null),
    record: jest.fn().mockResolvedValue(undefined),
    findRepairIdByKey: jest.fn().mockResolvedValue(null),
  };
  const service = new RepairsService(
    prisma as unknown as PrismaService,
    stores as unknown as StoresService,
    read as unknown as RepairsReadService,
    writes as unknown as RepairsWriteRepository,
    idem as unknown as RepairIdempotency,
  );
  return { service, read, writes, idem, tx, prisma };
}

const createDto = {
  customerId: 'cust-1',
  deviceName: 'iPhone 12',
  problem: 'screen',
  agreedPrice: 500_000,
  warrantyDays: 30,
};

describe('RepairsService.create', () => {
  it('allocates a ticket number and creates the ticket', async () => {
    const { service, writes, tx } = build();
    await service.create(caller, createDto);
    expect(writes.createTicket).toHaveBeenCalledWith(
      tx,
      1,
      expect.objectContaining({ storeId: 'store-1', customerId: 'cust-1' }),
    );
  });

  it('resolves the customer inside the create transaction', async () => {
    const { service, tx } = build();
    await service.create(caller, createDto);
    expect(tx.customer.findUnique).toHaveBeenCalled();
  });

  it('refuses a ticket with both an own and an outside master', async () => {
    const { service } = build();
    await expect(
      service.create(caller, {
        ...createDto,
        masterUserId: 'u-2',
        outsideMasterName: 'Bek',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('replays the ticket instead of writing when the key was already seen', async () => {
    const { service, idem, writes } = build();
    const view = { id: 'r-1', ticketNumber: 1 };
    idem.replay.mockResolvedValue(view);
    const result = await service.create(caller, {
      ...createDto,
      clientMutationId: 'k-1',
    });
    expect(result).toBe(view);
    expect(writes.createTicket).not.toHaveBeenCalled();
  });

  it('links a ticket to a stock device in the active store', async () => {
    const { service, prisma, writes } = build();
    await service.create(caller, { ...createDto, deviceId: 'd-1' });
    expect(prisma.device.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'd-1', storeId: 'store-1' } }),
    );
    expect(writes.createTicket).toHaveBeenCalledWith(
      expect.anything(),
      1,
      expect.objectContaining({ deviceId: 'd-1' }),
    );
  });

  it('refuses a device that is not in the active store', async () => {
    const { service, prisma } = build();
    prisma.device.findFirst.mockResolvedValue(null);
    await expect(
      service.create(caller, { ...createDto, deviceId: 'd-other' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('replays on a concurrent duplicate create key (P2002)', async () => {
    const { service, idem, writes, read } = build();
    const clash = Object.assign(new Error('duplicate'), {
      code: 'P2002',
      meta: { target: ['clientMutationId'] },
    });
    writes.transaction.mockRejectedValueOnce(clash);
    idem.findRepairIdByKey.mockResolvedValue('r-9');
    read.get.mockResolvedValue({ id: 'r-9' });
    const result = await service.create(caller, {
      ...createDto,
      clientMutationId: 'k-1',
    });
    expect(result).toEqual({ id: 'r-9' });
    expect(idem.findRepairIdByKey).toHaveBeenCalledWith('k-1');
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

  it('passes the read version to the guarded status write', async () => {
    const { service, writes } = build(rawFixture({ version: 7 }));
    await service.changeStatus(caller, 'r-1', { toStatusCode: 'IN_REPAIR' });
    expect(writes.changeStatus).toHaveBeenCalledWith(
      expect.anything(),
      'r-1',
      'READY',
      'IN_REPAIR',
      caller.id,
      undefined,
      7,
    );
  });
});

describe('RepairsService.update', () => {
  it('refuses to edit a terminal ticket', async () => {
    const { service } = build(rawFixture({ statusCode: 'GIVEN_BACK' }));
    await expect(
      service.update(caller, 'r-1', { problem: 'new' }),
    ).rejects.toThrow(ConflictException);
  });

  it('refuses an update that sets both master sides (XOR)', async () => {
    const { service } = build();
    await expect(
      service.update(caller, 'r-1', {
        masterUserId: 'u-2',
        outsideMasterName: 'Bek',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('validates the referenced model and master ids', async () => {
    const { service, prisma } = build();
    await service.update(caller, 'r-1', {
      modelId: 'm-1',
      masterUserId: 'u-2',
    });
    expect(prisma.deviceModel.findUnique).toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalled();
  });

  it('does the guarded update in a transaction with the read version', async () => {
    const { service, writes } = build(rawFixture({ version: 4 }));
    await service.update(caller, 'r-1', { problem: 'changed' });
    expect(writes.transaction).toHaveBeenCalled();
    expect(writes.updateDetails).toHaveBeenCalledWith(
      expect.anything(),
      'r-1',
      expect.objectContaining({ problem: 'changed' }),
      4,
    );
  });

  it('surfaces a version conflict instead of replaying it as a duplicate', async () => {
    const { service, writes, idem } = build();
    writes.updateDetails.mockRejectedValueOnce(
      new ConflictException({
        code: 'REPAIR_VERSION_CONFLICT',
        message: 'concurrent write',
      }),
    );
    await expect(
      service.update(caller, 'r-1', {
        problem: 'x',
        clientMutationId: 'k-1',
      }),
    ).rejects.toThrow(ConflictException);
    expect(idem.findRepairIdByKey).not.toHaveBeenCalled();
  });
});
