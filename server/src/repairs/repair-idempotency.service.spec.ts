import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { RepairIdempotency } from './repair-idempotency.service.js';
import { RepairsReadService } from './repairs-read.service.js';
import { RepairsWriteRepository } from './repairs.write.repository.js';

const caller: AuthenticatedUser = {
  id: 'u-1',
  email: 'c@x',
  permissions: new Set(),
};

function build() {
  const writes = {
    findMutationRepairId: jest.fn().mockResolvedValue(null),
    recordMutation: jest.fn().mockResolvedValue(undefined),
  };
  const read = { get: jest.fn().mockResolvedValue({ id: 'r-1' }) };
  const service = new RepairIdempotency(
    writes as unknown as RepairsWriteRepository,
    read as unknown as RepairsReadService,
  );
  return { service, writes, read };
}

describe('RepairIdempotency.findRepairIdByKey', () => {
  it('returns the repair id recorded for a key', async () => {
    const { service, writes } = build();
    writes.findMutationRepairId.mockResolvedValue('r-7');
    await expect(service.findRepairIdByKey('k-1')).resolves.toBe('r-7');
    expect(writes.findMutationRepairId).toHaveBeenCalledWith('k-1');
  });
});

describe('RepairIdempotency.replay', () => {
  it('returns null when there is no key', async () => {
    const { service } = build();
    await expect(service.replay(caller, undefined)).resolves.toBeNull();
  });

  it('returns null when the key is new', async () => {
    const { service } = build();
    await expect(service.replay(caller, 'k-new')).resolves.toBeNull();
  });

  it('returns the ticket view when the key is found', async () => {
    const { service, writes, read } = build();
    writes.findMutationRepairId.mockResolvedValue('r-9');
    read.get.mockResolvedValue({ id: 'r-9' });
    await expect(service.replay(caller, 'k-1')).resolves.toEqual({
      id: 'r-9',
    });
    expect(read.get).toHaveBeenCalledWith(caller, 'r-9');
  });
});

describe('RepairIdempotency.record', () => {
  it('records the key inside the given transaction', async () => {
    const { service, writes } = build();
    const tx = {} as unknown as PrismaTx;
    await service.record(tx, 'k-1', 'r-1', 'payment');
    expect(writes.recordMutation).toHaveBeenCalledWith(
      tx,
      'k-1',
      'r-1',
      'payment',
    );
  });

  it('is a no-op when there is no key', async () => {
    const { service, writes } = build();
    const tx = {} as unknown as PrismaTx;
    await service.record(tx, undefined, 'r-1', 'payment');
    expect(writes.recordMutation).not.toHaveBeenCalled();
  });
});
