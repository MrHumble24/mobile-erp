import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessService } from '../../access/access.service.js';
import { PermissionsGuard } from './permissions.guard.js';

function contextFor(user: unknown): ExecutionContext {
  const req = { user };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

function guardWith(
  effective: string[],
  meta: { isPublic?: boolean; required?: string[] },
): { guard: PermissionsGuard; access: AccessService } {
  const reflector = {
    getAllAndOverride: jest.fn((key: string) =>
      key === 'isPublic' ? meta.isPublic : meta.required,
    ),
  } as unknown as Reflector;
  const access = {
    getEffectivePermissions: jest.fn().mockResolvedValue(new Set(effective)),
  } as unknown as AccessService;
  return { guard: new PermissionsGuard(reflector, access), access };
}

describe('PermissionsGuard', () => {
  it('skips public routes without touching access', async () => {
    const { guard, access } = guardWith([], { isPublic: true });
    await expect(guard.canActivate(contextFor(undefined))).resolves.toBe(true);
    expect(access.getEffectivePermissions).not.toHaveBeenCalled();
  });

  it('rejects when no authenticated user is present', async () => {
    const { guard } = guardWith([], { required: ['user.manage'] });
    await expect(guard.canActivate(contextFor(undefined))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows an authenticated route with no required codes', async () => {
    const user = { id: 'u1', permissions: new Set<string>() };
    const { guard } = guardWith(['device.read'], { required: [] });
    await expect(guard.canActivate(contextFor(user))).resolves.toBe(true);
    expect([...user.permissions]).toEqual(['device.read']);
  });

  it('allows when every required code is held', async () => {
    const user = { id: 'u1', permissions: new Set<string>() };
    const { guard } = guardWith(['user.manage', 'role.manage'], {
      required: ['user.manage'],
    });
    await expect(guard.canActivate(contextFor(user))).resolves.toBe(true);
  });

  it('denies when a required code is missing', async () => {
    const user = { id: 'u1', permissions: new Set<string>() };
    const { guard } = guardWith(['device.read'], {
      required: ['user.manage'],
    });
    await expect(guard.canActivate(contextFor(user))).rejects.toThrow(
      ForbiddenException,
    );
  });
});
