import 'reflect-metadata';
import { RepairStatusSyncDto } from './repair-sync.dto.js';
import { RepairStatusHandler } from './repair.handlers.js';
import type { MutationContext } from './sync-handler.interface.js';
import { validateDto } from '../lib/validate-dto.js';

const ctx: MutationContext = {
  caller: { id: 'u1', permissions: new Set(['repair.manage']) } as never,
  mutationId: 'm-1',
};

describe('repair sync DTO', () => {
  it('keeps repairId and clientMutationId from the queued payload', async () => {
    const dto = await validateDto(RepairStatusSyncDto, {
      repairId: '11111111-1111-4111-8111-111111111111',
      toStatusCode: 'READY',
      clientMutationId: 'm-1',
    });
    expect(dto.repairId).toBe('11111111-1111-4111-8111-111111111111');
    expect(dto.clientMutationId).toBe('m-1');
  });

  it('rejects an unknown field instead of silently replaying it', async () => {
    await expect(
      validateDto(RepairStatusSyncDto, {
        repairId: '11111111-1111-4111-8111-111111111111',
        toStatusCode: 'READY',
        bogus: 'x',
      }),
    ).rejects.toThrow();
  });
});

describe('RepairStatusHandler', () => {
  const idem = { findRepairIdByKey: jest.fn().mockResolvedValue(null) };
  const repairs = { changeStatus: jest.fn().mockResolvedValue({ id: 'r1' }) };
  const handler = new RepairStatusHandler(idem as never, repairs as never);

  it('uses the queue id as the idempotency key on lookup', async () => {
    await handler.findExisting(ctx);
    expect(idem.findRepairIdByKey).toHaveBeenCalledWith('m-1');
  });

  it('threads repairId + mutation id into the service', async () => {
    const dto = Object.assign(new RepairStatusSyncDto(), {
      repairId: 'r1',
      toStatusCode: 'READY',
    });
    await handler.apply(ctx, dto);
    expect(repairs.changeStatus).toHaveBeenCalledWith(
      ctx.caller,
      'r1',
      expect.objectContaining({ toStatusCode: 'READY', clientMutationId: 'm-1' }),
    );
  });
});
