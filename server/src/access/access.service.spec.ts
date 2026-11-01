import { AccessService } from './access.service.js';
import { AccessRepository } from './access.repository.js';
import { PermissionSources } from './types/access.types.js';

function serviceWith(sources: PermissionSources): AccessService {
  const repo = {
    getPermissionSources: jest.fn().mockResolvedValue(sources),
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
