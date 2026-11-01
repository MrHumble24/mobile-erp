import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  PermissionSources,
  PermissionView,
  RoleView,
} from './types/access.types.js';

/** All Prisma access for roles, permissions and user overrides. */
@Injectable()
export class AccessRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getPermissionSources(userId: string): Promise<PermissionSources> {
    const roles = await this.prisma.userRole.findMany({
      where: { userId },
      select: {
        role: { select: { permissions: { select: { permissionCode: true } } } },
      },
    });
    const overrides = await this.prisma.userPermission.findMany({
      where: { userId },
      select: { permissionCode: true, granted: true },
    });

    return {
      rolePermissionCodes: roles.flatMap((r) =>
        r.role.permissions.map((p) => p.permissionCode),
      ),
      grantedCodes: overrides
        .filter((o) => o.granted)
        .map((o) => o.permissionCode),
      revokedCodes: overrides
        .filter((o) => !o.granted)
        .map((o) => o.permissionCode),
    };
  }

  async listRoles(): Promise<RoleView[]> {
    const rows = await this.prisma.role.findMany({
      orderBy: { code: 'asc' },
      include: { permissions: { select: { permissionCode: true } } },
    });
    return rows.map((r) => ({
      code: r.code,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      permissionCodes: r.permissions.map((p) => p.permissionCode),
    }));
  }

  async listPermissions(): Promise<PermissionView[]> {
    return this.prisma.permission.findMany({
      orderBy: { code: 'asc' },
      select: { code: true, resource: true, action: true, description: true },
    });
  }

  async findRole(
    code: string,
  ): Promise<{ code: string; isSystem: boolean } | null> {
    return this.prisma.role.findUnique({
      where: { code },
      select: { code: true, isSystem: true },
    });
  }

  async createRole(input: {
    code: string;
    name: string;
    description?: string;
  }): Promise<RoleView> {
    const r = await this.prisma.role.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description,
      },
    });
    return {
      code: r.code,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      permissionCodes: [],
    };
  }

  async replaceRolePermissions(
    code: string,
    permissionCodes: string[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleCode: code } }),
      this.prisma.rolePermission.createMany({
        data: permissionCodes.map((permissionCode) => ({
          roleCode: code,
          permissionCode,
        })),
        skipDuplicates: true,
      }),
    ]);
  }

  async deleteRole(code: string): Promise<void> {
    await this.prisma.role.delete({ where: { code } });
  }
}
