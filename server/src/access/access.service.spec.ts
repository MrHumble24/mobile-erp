import { ForbiddenException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { AccessService } from './access.service.js';
import { AccessRepository } from './access.repository.js';
import { PermissionSources } from './types/access.types.js';

function serviceWith(
  sources: Omit<PermissionSources, 'isActive'>,
): AccessService {
  const repo = {
    getPermissionSources: jest
      .fn()
      .mockResolvedValue({ isActive: true, ...sources }),
  } as unknown as AccessRepository;
  return new AccessService(repo);
}

describe('AccessService.getEffectivePermissions', () => {
  it('unions permissions across multiple roles', async () => {
    const svc = serviceWith({
      rolePermissionCodes: ['device.read', 'device.read', 'sale.read'],
      grantedCodes: [],
      revokedCodes: [],
    });
    const eff = await svc.getEffectivePermissions('u1');
    expect([...eff].sort()).toEqual(['device.read', 'sale.read']);
  });

  it('adds user grants on top of roles', async () => {
    const svc = serviceWith({
      rolePermissionCodes: ['device.read'],
      grantedCodes: ['sale.profit.view'],
      revokedCodes: [],
    });
    const eff = await svc.getEffectivePermissions('u1');
    expect(eff.has('sale.profit.view')).toBe(true);
    expect(eff.has('device.read')).toBe(true);
  });

  it('revoke beats a role permission', async () => {
    const svc = serviceWith({
      rolePermissionCodes: ['device.read', 'device.cost.view'],
      grantedCodes: [],
      revokedCodes: ['device.cost.view'],
    });
    const eff = await svc.getEffectivePermissions('u1');
    expect(eff.has('device.cost.view')).toBe(false);
    expect(eff.has('device.read')).toBe(true);
  });

  it('revoke beats a user grant', async () => {
    const svc = serviceWith({
      rolePermissionCodes: [],
      grantedCodes: ['sale.profit.view'],
      revokedCodes: ['sale.profit.view'],
    });
    const eff = await svc.getEffectivePermissions('u1');
    expect(eff.has('sale.profit.view')).toBe(false);
  });
});

describe('AccessService.describeUser', () => {
  it('nets role grants with user overrides and keeps the source', async () => {
    const repo = {
      getUserAccessDetail: jest.fn().mockResolvedValue({
        roles: ['CASHIER'],
        roleGrants: [
          { permissionCode: 'sale.read', roleCodes: ['CASHIER'] },
          { permissionCode: 'device.cost.view', roleCodes: ['CASHIER'] },
        ],
        overrides: [
          { permissionCode: 'device.cost.view', granted: false, reason: null },
          { permissionCode: 'report.finance', granted: true, reason: 'temp' },
        ],
      }),
    } as unknown as AccessRepository;
    const result = await new AccessService(repo).describeUser('u1');
    expect(result.effective.sort()).toEqual(['report.finance', 'sale.read']);
    expect(result.roles).toEqual(['CASHIER']);
  });
});

describe('AccessService.setRolePermissions', () => {
  function build(isSystem: boolean, callerPerms: string[]) {
    const replace = jest.fn().mockResolvedValue(undefined);
    const repo = {
      findRole: jest.fn().mockResolvedValue({ code: 'CLERK', isSystem }),
      listPermissions: jest
        .fn()
        .mockResolvedValue([
          { code: 'device.read' },
          { code: 'device.cost.view' },
        ]),
      replaceRolePermissions: replace,
      listRoles: jest
        .fn()
        .mockResolvedValue([{ code: 'CLERK', permissionCodes: [] }]),
    } as unknown as AccessRepository;
    const caller: AuthenticatedUser = {
      id: 'c',
      email: 'c@x',
      permissions: new Set(callerPerms),
    };
    return { service: new AccessService(repo), caller, replace };
  }

  it('rejects adding a permission the caller does not hold', async () => {
    const { service, caller, replace } = build(false, ['device.read']);
    await expect(
      service.setRolePermissions(caller, 'CLERK', [
        'device.read',
        'device.cost.view',
      ]),
    ).rejects.toThrow(ForbiddenException);
    expect(replace).not.toHaveBeenCalled();
  });

  it('allows setting permissions the caller holds', async () => {
    const { service, caller, replace } = build(false, [
      'device.read',
      'device.cost.view',
    ]);
    await service.setRolePermissions(caller, 'CLERK', ['device.read']);
    expect(replace).toHaveBeenCalledWith('CLERK', ['device.read']);
  });

  it('refuses to edit permissions of a system role', async () => {
    const { service, caller, replace } = build(true, ['device.read']);
    await expect(
      service.setRolePermissions(caller, 'CLERK', ['device.read']),
    ).rejects.toThrow(ForbiddenException);
    expect(replace).not.toHaveBeenCalled();
  });

  it('refuses to rename a system role', async () => {
    const repo = {
      findRole: jest.fn().mockResolvedValue({ code: 'ADMIN', isSystem: true }),
      renameRole: jest.fn(),
    } as unknown as AccessRepository;
    await expect(
      new AccessService(repo).renameRole('ADMIN', { name: 'x' }),
    ).rejects.toThrow(ForbiddenException);
  });
});
