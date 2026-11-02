import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProfileDto } from './dto/profile.dto.js';
import {
  CreateUserInput,
  PaginatedUsers,
  PermissionOverride,
  UserListFilters,
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

  async findPage(filters: UserListFilters): Promise<PaginatedUsers> {
    const where = buildWhere(filters);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
        select: userSelect,
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: rows.map(toView),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
    };
  }

  /** Counts per role code across all users, for the summary tiles. */
  async countByRole(): Promise<Record<string, number>> {
    const rows = await this.prisma.userRole.groupBy({
      by: ['roleCode'],
      _count: { roleCode: true },
    });
    return Object.fromEntries(rows.map((r) => [r.roleCode, r._count.roleCode]));
  }

  async countActive(): Promise<{ total: number; active: number }> {
    const [total, active] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);
    return { total, active };
  }

  /** Active users holding ADMIN other than `excludeUserId` (last-admin guard). */
  countOtherActiveAdmins(excludeUserId: string): Promise<number> {
    return this.prisma.user.count({
      where: {
        id: { not: excludeUserId },
        isActive: true,
        roles: { some: { roleCode: 'ADMIN' } },
      },
    });
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

  async setPassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { passwordHash } });
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

function buildWhere(filters: UserListFilters): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};
  if (filters.active !== undefined) where.isActive = filters.active;
  if (filters.role) where.roles = { some: { roleCode: filters.role } };
  if (filters.search) {
    const q = filters.search.trim();
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { profile: { firstName: { contains: q, mode: 'insensitive' } } },
      { profile: { lastName: { contains: q, mode: 'insensitive' } } },
    ];
  }
  return where;
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
