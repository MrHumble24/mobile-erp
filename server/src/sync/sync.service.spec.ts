import { ConflictException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import type { StoresService } from '../stores/stores.service.js';
import type { MutationDto } from './dto/push.dto.js';
import { SyncHandlerRegistry } from './handlers/handler-registry.js';
import { SyncRepository } from './sync.repository.js';
import { SyncService } from './sync.service.js';

// Payload validation is exercised by the real module DTOs; here we isolate the
// dispatch/permission/conflict logic.
jest.mock('./lib/validate-dto.js', () => ({
  validateDto: (_cls: unknown, payload: unknown) => Promise.resolve(payload),
}));

class DummyDto {}

const caller = (perms: string[] = ['sale.create']): AuthenticatedUser => ({
  id: 'u1',
  email: 'c@x',
  permissions: new Set(perms),
});

function build(
  handlerOverrides: Record<string, unknown> = {},
  storesOverrides: Record<string, unknown> = {},
  cutoffSec = 0,
) {
  const handler = {
    permission: 'sale.create',
    dtoClass: DummyDto,
    findExisting: jest.fn().mockResolvedValue(null),
    apply: jest.fn().mockResolvedValue({ id: 'sale-1' }),
    deviceId: jest.fn().mockResolvedValue('dev-1'),
    ...handlerOverrides,
  };
  const registry = { get: jest.fn().mockReturnValue(handler) };
  const repo = {
    insertConflict: jest.fn().mockResolvedValue({ id: 'conf-1' }),
  };
  const stores = {
    allowedStoreIds: jest.fn().mockResolvedValue(['store-1']),
    ...storesOverrides,
  };
  const sessionGate = { cutoffSec: jest.fn().mockResolvedValue(cutoffSec) };
  const service = new SyncService(
    registry as unknown as SyncHandlerRegistry,
    repo as unknown as SyncRepository,
    stores as unknown as StoresService,
    sessionGate as never,
  );
  return { service, handler, registry, repo, stores };
}

const mutation = {
  id: 'm-1',
  type: 'sale.create',
  payload: {},
  occurredAt: '2026-11-01T00:00:00.000Z',
};

function pushOne(service: SyncService, user = caller(), m: MutationDto = mutation) {
  return service
    .push(user, { terminalId: 't-1', mutations: [m] })
    .then((r) => r.results[0]);
}

describe('SyncService.push dispatch', () => {
  it('applies a valid mutation', async () => {
    const { service, handler } = build();
    const result = await pushOne(service);
    expect(result).toEqual({
      id: 'm-1',
      status: 'applied',
      record: { id: 'sale-1' },
    });
    expect(handler.apply).toHaveBeenCalled();
  });

  it('drops a mutation queued before the last erase/restore (MUTATION_BEFORE_RESET)', async () => {
    const cutoff = Math.floor(Date.parse('2026-11-05T00:00:00.000Z') / 1000);
    const { service, handler } = build({}, {}, cutoff);
    const result = await pushOne(service); // mutation.occurredAt is 2026-11-01
    expect(result).toEqual({
      id: 'm-1',
      status: 'rejected',
      error: 'MUTATION_BEFORE_RESET',
    });
    expect(handler.apply).not.toHaveBeenCalled();
  });

  it('keeps applying mutations made after the reset', async () => {
    const cutoff = Math.floor(Date.parse('2026-10-01T00:00:00.000Z') / 1000);
    const { service, handler } = build({}, {}, cutoff);
    const result = await pushOne(service); // 2026-11-01 is after the cutoff
    expect(result.status).toBe('applied');
    expect(handler.apply).toHaveBeenCalled();
  });

  it('marks a replay as duplicate without applying', async () => {
    const { service, handler } = build({
      findExisting: jest.fn().mockResolvedValue({ id: 'prev' }),
    });
    const result = await pushOne(service);
    expect(result).toEqual({
      id: 'm-1',
      status: 'duplicate',
      record: { id: 'prev' },
    });
    expect(handler.apply).not.toHaveBeenCalled();
  });

  it('logs a conflict when the service throws ConflictException', async () => {
    const { service, repo } = build({
      apply: jest.fn().mockRejectedValue(new ConflictException('stale')),
    });
    const result = await pushOne(service);
    expect(result).toEqual({
      id: 'm-1',
      status: 'conflict',
      conflictId: 'conf-1',
    });
    expect(repo.insertConflict).toHaveBeenCalledWith(
      expect.objectContaining({ deviceId: 'dev-1', terminalId: 't-1' }),
    );
  });

  it('rejects a non-conflict error with its message, no conflict row', async () => {
    const { service, repo } = build({
      apply: jest.fn().mockRejectedValue(new Error('boom')),
    });
    const result = await pushOne(service);
    expect(result).toEqual({ id: 'm-1', status: 'rejected', error: 'boom' });
    expect(repo.insertConflict).not.toHaveBeenCalled();
  });

  it('rejects when the caller lacks the mutation permission', async () => {
    const { service, handler } = build();
    const result = await pushOne(service, caller([]));
    expect(result.status).toBe('rejected');
    expect(result.error).toContain('sale.create');
    expect(handler.apply).not.toHaveBeenCalled();
  });

  it('rejects an unknown mutation type', async () => {
    const { service, registry } = build();
    registry.get.mockReturnValue(undefined);
    const result = await pushOne(service);
    expect(result.status).toBe('rejected');
    expect(result.error).toContain('Unknown mutation type');
  });

  it('rejects mutation with STORE_FORBIDDEN when mutation storeId is not in caller allowed stores', async () => {
    const { service, handler } = build(
      {},
      { allowedStoreIds: jest.fn().mockResolvedValue(['store-1']) },
    );
    const result = await pushOne(service, caller(), {
      ...mutation,
      storeId: 'store-2',
    });
    expect(result.status).toBe('rejected');
    expect(result.error).toBe('STORE_FORBIDDEN');
    expect(handler.apply).not.toHaveBeenCalled();
  });

  it('rejects mutation with STORE_REQUIRED when user works in several stores and mutation lacks storeId', async () => {
    const { service, handler } = build(
      {},
      { allowedStoreIds: jest.fn().mockResolvedValue(['store-1', 'store-2']) },
    );
    const result = await pushOne(service, caller(), {
      ...mutation,
      storeId: undefined,
    });
    expect(result.status).toBe('rejected');
    expect(result.error).toBe('STORE_REQUIRED');
    expect(handler.apply).not.toHaveBeenCalled();
  });

  it('applies mutation in user single store when mutation lacks storeId', async () => {
    const { service, handler } = build(
      {},
      { allowedStoreIds: jest.fn().mockResolvedValue(['store-1']) },
    );
    const result = await pushOne(service, caller(), {
      ...mutation,
      storeId: undefined,
    });
    expect(result.status).toBe('applied');
    expect(handler.apply).toHaveBeenCalled();
  });
});
