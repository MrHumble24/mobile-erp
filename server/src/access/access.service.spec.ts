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
