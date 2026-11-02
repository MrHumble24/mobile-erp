import { ConflictException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
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

function build(handlerOverrides: Record<string, unknown> = {}) {
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
  const service = new SyncService(
    registry as unknown as SyncHandlerRegistry,
    repo as unknown as SyncRepository,
  );
  return { service, handler, registry, repo };
}

const mutation = {
  id: 'm-1',
  type: 'sale.create',
  payload: {},
  occurredAt: '2026-11-01T00:00:00.000Z',
};

function pushOne(service: SyncService, user = caller(), m = mutation) {
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
});
