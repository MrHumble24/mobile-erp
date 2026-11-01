import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProfileDto } from './dto/profile.dto.js';
import {
  CreateUserInput,
  PermissionOverride,
  UserView,
} from './types/user.types.js';

const userSelect = {
  id: true,
  email: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  profile: {
    select: {
      firstName: true,
      lastName: true,
      phone: true,
      telegramHandle: true,
      avatarUrl: true,
      locale: true,
    },
  },
  roles: { select: { roleCode: true } },
} as const;

type UserRow = {
  id: string;
  email: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  profile: UserView['profile'];
  roles: { roleCode: string }[];
};

/** All Prisma access for user accounts. Never selects passwordHash outward. */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<UserView[]> {
    const rows = await this.prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: userSelect,
    });
    return rows.map(toView);
  }

  async findById(id: string): Promise<UserView | null> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    return row ? toView(row) : null;
  }

  async create(input: CreateUserInput): Promise<UserView> {
    const row = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        profile: { create: input.profile },
        roles: { create: input.roleCodes.map((roleCode) => ({ roleCode })) },
      },
      select: userSelect,
    });
    return toView(row);
  }

  async update(
    id: string,
    data: { profile?: ProfileDto; isActive?: boolean },
  ): Promise<UserView> {
    const row = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: data.isActive,
        profile: data.profile ? { update: data.profile } : undefined,
      },
      select: userSelect,
    });
    return toView(row);
  }

  async setRoles(id: string, roleCodes: string[]): Promise<UserView> {
    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId: id } }),
      this.prisma.userRole.createMany({
        data: roleCodes.map((roleCode) => ({ userId: id, roleCode })),
        skipDuplicates: true,
      }),
    ]);
    return (await this.findById(id))!;
  }

  async setPermissions(
    id: string,
    overrides: PermissionOverride[],
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.userPermission.deleteMany({ where: { userId: id } }),
      this.prisma.userPermission.createMany({
        data: overrides.map((o) => ({
          userId: id,
          permissionCode: o.permissionCode,
          granted: o.granted,
          reason: o.reason,
        })),
        skipDuplicates: true,
      }),
    ]);
  }
}

function toView(row: UserRow): UserView {
  return {
    id: row.id,
    email: row.email,
    isActive: row.isActive,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    profile: row.profile,
    roles: row.roles.map((r) => r.roleCode),
  };
}
