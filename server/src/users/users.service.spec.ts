import { ForbiddenException } from '@nestjs/common';
import { AccessService } from '../access/access.service.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { UsersService } from './users.service.js';
import { UsersRepository } from './users.repository.js';

function build(callerPerms: string[]): {
  service: UsersService;
  repo: { setRoles: jest.Mock; setPermissions: jest.Mock };
  caller: AuthenticatedUser;
} {
  const repo = {
    findById: jest.fn().mockResolvedValue({ id: 'target', email: 'x' }),
    setRoles: jest.fn().mockResolvedValue({ id: 'target' }),
    setPermissions: jest.fn().mockResolvedValue(undefined),
  };
  const access = {
    listRoles: jest.fn().mockResolvedValue([
      { code: 'ADMIN', permissionCodes: ['device.cost.view'] },
      { code: 'CLERK', permissionCodes: ['device.read'] },
    ]),
    listPermissions: jest
      .fn()
      .mockResolvedValue([
        { code: 'device.cost.view' },
        { code: 'device.read' },
      ]),
  };
  const service = new UsersService(
    repo as unknown as UsersRepository,
    access as unknown as AccessService,
  );
  const caller: AuthenticatedUser = {
    id: 'caller',
    email: 'caller@x',
    permissions: new Set(callerPerms),
  };
  return { service, repo, caller };
}

describe('UsersService privilege escalation', () => {
  it('rejects changing your own roles', async () => {
    const { service, caller, repo } = build(['device.read']);
    await expect(
      service.setRoles(caller, 'caller', { roleCodes: ['CLERK'] }),
    ).rejects.toThrow(ForbiddenException);
    expect(repo.setRoles).not.toHaveBeenCalled();
  });

  it('rejects assigning a role granting permissions the caller lacks', async () => {
    const { service, caller, repo } = build(['device.read']);
    await expect(
      service.setRoles(caller, 'target', { roleCodes: ['ADMIN'] }),
    ).rejects.toThrow(ForbiddenException);
    expect(repo.setRoles).not.toHaveBeenCalled();
  });

  it('allows assigning a role whose permissions the caller holds', async () => {
    const { service, caller, repo } = build(['device.read']);
    await service.setRoles(caller, 'target', { roleCodes: ['CLERK'] });
    expect(repo.setRoles).toHaveBeenCalledWith('target', ['CLERK']);
  });

  it('rejects granting a permission the caller does not hold', async () => {
    const { service, caller, repo } = build(['device.read']);
    await expect(
      service.setPermissions(caller, 'target', {
        overrides: [{ permissionCode: 'device.cost.view', granted: true }],
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(repo.setPermissions).not.toHaveBeenCalled();
  });

  it('allows revoking a permission the caller does not hold', async () => {
    const { service, caller, repo } = build(['device.read']);
    await service.setPermissions(caller, 'target', {
      overrides: [{ permissionCode: 'device.cost.view', granted: false }],
    });
    expect(repo.setPermissions).toHaveBeenCalled();
  });
});
