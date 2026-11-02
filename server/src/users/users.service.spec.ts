import { ConflictException, ForbiddenException } from '@nestjs/common';
import { AccessService } from '../access/access.service.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { UsersService } from './users.service.js';
import { UsersRepository } from './users.repository.js';

interface BuildOpts {
  target?: Record<string, unknown>;
  otherAdmins?: number;
  targetPermissions?: string[];
}

function build(
  callerPerms: string[],
  opts: BuildOpts = {},
): {
  service: UsersService;
  repo: {
    setRoles: jest.Mock;
    setPermissions: jest.Mock;
    setPassword: jest.Mock;
    update: jest.Mock;
    countOtherActiveAdmins: jest.Mock;
  };
  caller: AuthenticatedUser;
} {
  const repo = {
    findById: jest
      .fn()
      .mockResolvedValue(opts.target ?? { id: 'target', email: 'x' }),
    setRoles: jest.fn().mockResolvedValue({ id: 'target' }),
    setPermissions: jest.fn().mockResolvedValue(undefined),
    setPassword: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue({ id: 'target' }),
    countOtherActiveAdmins: jest.fn().mockResolvedValue(opts.otherAdmins ?? 0),
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
    getEffectivePermissions: jest
      .fn()
      .mockResolvedValue(new Set(opts.targetPermissions ?? [])),
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

  it('rejects deactivating your own account', async () => {
    const { service, caller } = build(['user.manage']);
    await expect(
      service.update(caller, 'caller', { isActive: false }),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe('UsersService.resetPassword subset rule', () => {
  it('refuses resetting a target holding permissions the caller lacks', async () => {
    const { service, caller, repo } = build(['user.manage'], {
      targetPermissions: ['user.manage', 'device.cost.view'],
    });
    await expect(
      service.resetPassword(caller, 'target', 'secret12'),
    ).rejects.toThrow(ForbiddenException);
    expect(repo.setPassword).not.toHaveBeenCalled();
  });

  it('allows resetting a target within the caller scope', async () => {
    const { service, caller, repo } = build(['user.manage', 'device.read'], {
      targetPermissions: ['device.read'],
    });
    await service.resetPassword(caller, 'target', 'secret12');
    expect(repo.setPassword).toHaveBeenCalled();
  });
});

describe('UsersService last-admin protection', () => {
  const admin = { id: 'target', email: 'a', isActive: true, roles: ['ADMIN'] };

  it('refuses to deactivate the last active admin', async () => {
    const { service, caller, repo } = build(['user.manage'], {
      target: admin,
      otherAdmins: 0,
    });
    await expect(
      service.update(caller, 'target', { isActive: false }),
    ).rejects.toThrow(ConflictException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('allows deactivating an admin when another active admin remains', async () => {
    const { service, caller, repo } = build(['user.manage'], {
      target: admin,
      otherAdmins: 1,
    });
    await service.update(caller, 'target', { isActive: false });
    expect(repo.update).toHaveBeenCalled();
  });

  it('refuses to remove ADMIN from the last active admin via setRoles', async () => {
    const { service, caller, repo } = build(
      ['user.manage', 'device.read', 'device.cost.view'],
      { target: admin, otherAdmins: 0 },
    );
    await expect(
      service.setRoles(caller, 'target', { roleCodes: ['CLERK'] }),
    ).rejects.toThrow(ConflictException);
    expect(repo.setRoles).not.toHaveBeenCalled();
  });
});
