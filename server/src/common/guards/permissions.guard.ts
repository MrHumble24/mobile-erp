import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessService } from '../../access/access.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import {
  PERMISSIONS_ANY_KEY,
  PERMISSIONS_KEY,
} from '../decorators/require-permissions.decorator.js';
import { AuthenticatedUser } from '../types/authenticated-user.js';

/**
 * Loads the user's effective permission set fresh on every request (so revokes
 * take effect immediately), attaches it to the request, and enforces any
 * `@RequirePermissions(...)` or `@RequireAnyPermissions(...)` codes. Never checks a role name.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly access: AccessService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = req.user;
    if (!user) throw new ForbiddenException('Not authenticated');

    const { isActive, permissions } = await this.access.getEffectiveAccess(
      user.id,
    );
    if (!isActive) throw new UnauthorizedException('Account is inactive');
    user.permissions = permissions;

    const required =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) ?? [];
    if (
      required.length > 0 &&
      !required.every((c) => user.permissions.has(c))
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const requiredAny =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_ANY_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) ?? [];
    if (
      requiredAny.length > 0 &&
      !requiredAny.some((c) => user.permissions.has(c))
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
