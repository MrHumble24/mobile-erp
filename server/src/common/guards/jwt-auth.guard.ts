import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { SessionGateService } from '../runtime/session-gate.service.js';

interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
}

interface RequestWithAuth {
  headers: Record<string, string | undefined>;
  user?: { id: string; email: string; permissions: Set<string> };
}

/** Verifies the HS256 bearer token and attaches `{ id, email }` to the request. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly sessionGate: SessionGateService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<RequestWithAuth>();
    const token = this.extractToken(req.headers.authorization);
    if (!token) throw new UnauthorizedException('Missing bearer token');

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    // A restore ends every session: tokens issued before the cutoff are dead.
    if (!(await this.sessionGate.isValid(payload.iat))) {
      throw new UnauthorizedException('Session ended; sign in again');
    }
    req.user = {
      id: payload.sub,
      email: payload.email,
      permissions: new Set<string>(),
    };
    return true;
  }

  private extractToken(header: string | undefined): string | null {
    if (!header) return null;
    const [type, token] = header.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}
