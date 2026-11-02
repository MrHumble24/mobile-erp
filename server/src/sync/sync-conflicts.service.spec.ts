import { ConflictException, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { SyncHandlerRegistry } from './handlers/handler-registry.js';
import { SyncConflictsService } from './sync-conflicts.service.js';
import { SyncRepository } from './sync.repository.js';

jest.mock('./lib/validate-dto.js', () => ({
  validateDto: (_cls: unknown, payload: unknown) => Promise.resolve(payload),
}));

class DummyDto {}

const caller: AuthenticatedUser = {
  id: 'admin-1',
  email: 'a@x',
  permissions: new Set(['sync.resolve']),
};

function build(
  overrides: {
    conflict?: unknown;
    apply?: jest.Mock;
  } = {},
) {
  const handler = {
    dtoClass: DummyDto,
    apply: overrides.apply ?? jest.fn().mockResolvedValue({ id: 'ok' }),
  };
  const registry = { get: jest.fn().mockReturnValue(handler) };
  const repo = {
    findForResolve: jest.fn().mockResolvedValue(
      overrides.conflict ?? {
        id: 'conf-1',
        deviceId: 'dev-1',
        attemptedChange: {
          type: 'sale.create',
          payload: {},
          mutationId: 'm-1',
        },
        resolvedAt: null,
      },
    ),
    currentDeviceVersion: jest.fn().mockResolvedValue(7),
    resolve: jest.fn().mockResolvedValue({ id: 'conf-1' }),
  };
  const service = new SyncConflictsService(
    repo as unknown as SyncRepository,
    registry as unknown as SyncHandlerRegistry,
  );
  return { service, handler, repo };
}

describe('SyncConflictsService.resolve', () => {
  it('keep-server marks resolved without replaying', async () => {
    const { service, handler, repo } = build();
    await service.resolve(caller, 'conf-1', { resolution: 'keep-server' });
    expect(handler.apply).not.toHaveBeenCalled();
    expect(repo.resolve).toHaveBeenCalledWith('conf-1', {
      resolvedById: 'admin-1',
      resolution: 'keep-server',
    });
  });

  it('apply-terminal replays at the current version and resolves', async () => {
    const { service, handler, repo } = build();
    await service.resolve(caller, 'conf-1', { resolution: 'apply-terminal' });
    expect(handler.apply).toHaveBeenCalledWith(
      expect.objectContaining({ baseVersion: 7, mutationId: 'm-1' }),
      expect.anything(),
    );
    expect(repo.resolve).toHaveBeenCalledWith('conf-1', {
      resolvedById: 'admin-1',
      resolution: 'apply-terminal',
    });
  });

  it('leaves the conflict pending (409) when the replay still clashes', async () => {
    const { service, repo } = build({
      apply: jest.fn().mockRejectedValue(new ConflictException('already SOLD')),
    });
    await expect(
      service.resolve(caller, 'conf-1', { resolution: 'apply-terminal' }),
    ).rejects.toThrow(ConflictException);
    expect(repo.resolve).not.toHaveBeenCalled();
  });

  it('404s an unknown conflict', async () => {
    const repo = { findForResolve: jest.fn().mockResolvedValue(null) };
    const service = new SyncConflictsService(
      repo as unknown as SyncRepository,
      { get: jest.fn() } as unknown as SyncHandlerRegistry,
    );
    await expect(
      service.resolve(caller, 'x', { resolution: 'keep-server' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('409s a conflict that is already resolved', async () => {
    const { service } = build({
      conflict: {
        id: 'conf-1',
        deviceId: 'dev-1',
        attemptedChange: {
          type: 'sale.create',
          payload: {},
          mutationId: 'm-1',
        },
        resolvedAt: new Date(),
      },
    });
    await expect(
      service.resolve(caller, 'conf-1', { resolution: 'keep-server' }),
    ).rejects.toThrow(ConflictException);
  });
});
