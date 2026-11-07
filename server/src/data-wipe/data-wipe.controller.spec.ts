import 'reflect-metadata';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../common/decorators/require-permissions.decorator.js';
import { PermissionsGuard } from '../common/guards/permissions.guard.js';
import { AccessService } from '../access/access.service.js';
import { DataWipeController } from './data-wipe.controller.js';

const perms = (handler: unknown): string[] =>
  Reflect.getMetadata(PERMISSIONS_KEY, handler as object);

function contextFor(user: unknown): ExecutionContext {
  const req = { user };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => DataWipeController.prototype.reset,
    getClass: () => DataWipeController,
  } as unknown as ExecutionContext;
}

describe('DataWipeController route permissions', () => {
  it('guards POST /data-wipe with data.wipe', () => {
    expect(perms(DataWipeController.prototype.erase)).toEqual(['data.wipe']);
  });

  it('guards POST /data-wipe/reset with data.reset', () => {
    expect(perms(DataWipeController.prototype.reset)).toEqual(['data.reset']);
  });

  it('denies access with 403 when data.reset is missing (even for an admin made without it)', async () => {
    const reflector = new Reflector();
    // Simulate an ADMIN account that has all other permissions except data.reset
    const access = {
      getEffectiveAccess: jest.fn().mockResolvedValue({
        isActive: true,
        permissions: new Set(['data.wipe', 'backup.manage', 'backup.restore']),
      }),
    } as unknown as AccessService;
    const guard = new PermissionsGuard(reflector, access);
    const user = { id: 'admin-1', permissions: new Set<string>() };

    await expect(guard.canActivate(contextFor(user))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows access when user has data.reset', async () => {
    const reflector = new Reflector();
    const access = {
      getEffectiveAccess: jest.fn().mockResolvedValue({
        isActive: true,
        permissions: new Set(['data.reset']),
      }),
    } as unknown as AccessService;
    const guard = new PermissionsGuard(reflector, access);
    const user = { id: 'admin-1', permissions: new Set<string>() };

    await expect(guard.canActivate(contextFor(user))).resolves.toBe(true);
  });
});
