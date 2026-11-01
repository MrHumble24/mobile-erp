import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AccessService } from '../access/access.service.js';
import { AuthRepository } from './auth.repository.js';
import { LoginDto } from './dto/login.dto.js';
import { MeView } from './types/auth.types.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly jwt: JwtService,
    private readonly access: AccessService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string; user: MeView }> {
    const creds = await this.repo.findByEmail(dto.email);
    if (!creds) throw new UnauthorizedException('Invalid credentials');
    if (!creds.isActive) throw new UnauthorizedException('Account is disabled');

    const valid = await argon2.verify(creds.passwordHash, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.repo.updateLastLogin(creds.id);
    const accessToken = await this.jwt.signAsync({
      sub: creds.id,
      email: creds.email,
    });
    return { accessToken, user: await this.me(creds.id) };
  }

  async me(userId: string): Promise<MeView> {
    const identity = await this.repo.findIdentity(userId);
    if (!identity) throw new UnauthorizedException('User no longer exists');
    const permissions = await this.access.getEffectivePermissions(userId);
    return { ...identity, permissions: [...permissions] };
  }
}
