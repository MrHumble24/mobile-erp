import { ConflictException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import { StockService } from '../stock/stock.service.js';
import { StoresService } from '../stores/stores.service.js';
import { RepairIdempotency } from './repair-idempotency.service.js';
import { RepairsPartsService } from './repairs-parts.service.js';
import { RepairsReadService } from './repairs-read.service.js';
import { RepairsRepository } from './repairs.repository.js';
import { RepairsWriteRepository } from './repairs.write.repository.js';

const caller: AuthenticatedUser = {
  id: 'u-1',
  email: 'c@x',
  permissions: new Set(['repair.manage']),
};

const D = (n: number) => new Prisma.Decimal(n);

interface Movement {
  typeCode: string;
  quantity: number;
  unitCostSnapshot: Prisma.Decimal;
}
const firstMove = (stock: { postMovement: jest.Mock }): Movement =>
  stock.postMovement.mock.calls[0][0] as Movement;

function build(statusCode = 'IN_REPAIR', part: unknown = null, version = 1) {
  const read = {
    assertEnabled: jest.fn().mockResolvedValue(undefined),
    require: jest
      .fn()
      .mockResolvedValue({ id: 'r-1', ticketNumber: 7, statusCode, version }),
    get: jest.fn().mockResolvedValue({ id: 'r-1' }),
  };
  const repo = { findPartById: jest.fn().mockResolvedValue(part) };
  const writes = {
    transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn({})),
    createPart: jest.fn().mockResolvedValue('part-1'),
    deletePart: jest.fn().mockResolvedValue(undefined),
  };
  const stock = {
    assertQuantityModel: jest.fn().mockResolvedValue(undefined),
    averageCost: jest.fn().mockResolvedValue(D(30_000)),
    postMovement: jest.fn().mockResolvedValue(undefined),
  };
  const stores = { currentStoreId: jest.fn().mockResolvedValue('store-1') };
  const idem = {
    replay: jest.fn().mockResolvedValue(null),
    record: jest.fn().mockResolvedValue(undefined),
    findRepairIdByKey: jest.fn().mockResolvedValue(null),
  };
  const service = new RepairsPartsService(
    read as unknown as RepairsReadService,
    repo as unknown as RepairsRepository,
    writes as unknown as RepairsWriteRepository,
    stock as unknown as StockService,
    stores as unknown as StoresService,
    idem as unknown as RepairIdempotency,
  );
  return { service, read, repo, writes, stock, idem };
}

describe('RepairsPartsService.addPart', () => {
  it('takes pieces out of stock at the frozen average cost', async () => {
    const { service, writes, stock } = build();
    await service.addPart(caller, 'r-1', { modelId: 'm-1', quantity: 2 });
    expect(writes.createPart).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ quantity: 2, modelId: 'm-1' }),
      1,
    );
    const move = firstMove(stock);
    expect(move.typeCode).toBe('REPAIR_USE');
    expect(move.quantity).toBe(-2); // pieces leave stock
    expect(move.unitCostSnapshot.toFixed(2)).toBe('30000.00');
  });

  it('refuses to add a part to a terminal ticket', async () => {
    const { service, stock } = build('GIVEN_BACK');
    await expect(
      service.addPart(caller, 'r-1', { modelId: 'm-1', quantity: 1 }),
    ).rejects.toThrow(ConflictException);
    expect(stock.postMovement).not.toHaveBeenCalled();
  });

  it('replays the ticket when the part key was already seen', async () => {
    const { service, idem, stock } = build();
    const view = { id: 'r-1' };
    idem.replay.mockResolvedValue(view);
    const result = await service.addPart(caller, 'r-1', {
      modelId: 'm-1',
      quantity: 1,
      clientMutationId: 'k-1',
    });
    expect(result).toBe(view);
    expect(stock.postMovement).not.toHaveBeenCalled();
  });

  it('bumps the version with the read version', async () => {
    const { service, writes } = build('IN_REPAIR', null, 6);
    await service.addPart(caller, 'r-1', { modelId: 'm-1', quantity: 1 });
    expect(writes.createPart).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      6,
    );
  });
});

describe('RepairsPartsService.removePart', () => {
  it("puts the pieces back at the part's own cost and deletes the row", async () => {
    const { service, writes, stock } = build('IN_REPAIR', {
      id: 'part-1',
      modelId: 'm-1',
      quantity: 2,
      unitCostSnapshot: D(30_000),
    });
    await service.removePart(caller, 'r-1', 'part-1');
    const move = firstMove(stock);
    expect(move.quantity).toBe(2); // pieces return to stock
    expect(move.unitCostSnapshot.toFixed(2)).toBe('30000.00');
    expect(writes.deletePart).toHaveBeenCalledWith({}, 'part-1', 'r-1', 1);
  });

  it('404s an unknown part', async () => {
    const { service } = build('IN_REPAIR', null);
    await expect(service.removePart(caller, 'r-1', 'nope')).rejects.toThrow(
      NotFoundException,
    );
  });
});
