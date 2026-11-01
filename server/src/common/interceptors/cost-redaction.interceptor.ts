import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { AuthenticatedUser } from '../types/authenticated-user.js';
import { COST_KEYS, PROFIT_KEYS, stripKeys } from '../lib/redact.js';

/**
 * Strips acquisition/landed cost keys unless the user holds `device.cost.view`,
 * and net-profit keys unless they hold `sale.profit.view`. Default deny: no
 * authenticated user means everything sensitive is stripped.
 */
@Injectable()
export class CostRedactionInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const user = ctx
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser }>().user;
    const perms = user?.permissions ?? new Set<string>();

    const strip = new Set<string>();
    if (!perms.has('device.cost.view')) COST_KEYS.forEach((k) => strip.add(k));
    if (!perms.has('sale.profit.view'))
      PROFIT_KEYS.forEach((k) => strip.add(k));

    if (strip.size === 0) return next.handle();
    return next.handle().pipe(map((data) => stripKeys(data, strip)));
  }
}
