import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthCredentials, UserProfileView } from './types/auth.types.js';

/** Prisma access for authentication: credentials and the /me projection. */
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<AuthCredentials | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true, isActive: true },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async findIdentity(id: string): Promise<{
    id: string;
    email: string;
    profile: UserProfileView | null;
    roles: string[];
  } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
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
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      profile: user.profile,
      roles: user.roles.map((r) => r.roleCode),
    };
  }
}
