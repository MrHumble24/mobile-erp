import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AccessService } from '../access/access.service.js';
import { StoresService } from '../stores/stores.service.js';
import { CompanyService } from '../company/company.service.js';
import { AuthRepository } from './auth.repository.js';
import { LoginDto } from './dto/login.dto.js';
import { MeView } from './types/auth.types.js';

/** Precomputed hash so a missing user costs the same as a real verify. */
const DUMMY_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$JDhaYPIpeWLUrXDEM40pcg$+4XGb3Ud069bgG9meB45z5D7nsdfKfefMDn/1SBb/6A';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly repo: AuthRepository,
    private readonly jwt: JwtService,
    private readonly access: AccessService,
    private readonly stores: StoresService,
    private readonly company: CompanyService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string; user: MeView }> {
    const creds = await this.repo.findByEmail(dto.email);
    // Always verify (dummy hash when unknown) so timing does not leak which
    // emails exist. One generic 401 for unknown / wrong password / disabled.
    const valid = await argon2.verify(
      creds?.passwordHash ?? DUMMY_HASH,
      dto.password,
    );
    if (!creds || !valid || !creds.isActive) {
      if (creds && valid && !creds.isActive) {
        this.logger.warn(`Login blocked for disabled account ${creds.id}`);
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.repo.updateLastLogin(creds.id);
    const sessionDuration = await this.company.getSessionDuration();
    const accessToken = await this.jwt.signAsync(
      {
        sub: creds.id,
        email: creds.email,
      },
      { expiresIn: sessionDuration as `${number}${'s' | 'm' | 'h' | 'd'}` },
    );
    return { accessToken, user: await this.me(creds.id) };
  }

  /** Re-check a signed-in user's own password (restore confirmation). */
  async verifyPassword(email: string, password: string): Promise<boolean> {
    const creds = await this.repo.findByEmail(email);
    if (!creds || !creds.isActive) return false;
    return argon2.verify(creds.passwordHash, password);
  }

  async me(userId: string): Promise<MeView> {
    const identity = await this.repo.findIdentity(userId);
    if (!identity) throw new UnauthorizedException('User no longer exists');
    const permissions = await this.access.getEffectivePermissions(userId);
    const userStores = await this.stores.storesForUser({
      id: userId,
      email: identity.email,
      permissions,
    });
    return {
      ...identity,
      permissions: [...permissions],
      stores: userStores.map((s) => ({ id: s.id, name: s.name })),
    };
  }
}
