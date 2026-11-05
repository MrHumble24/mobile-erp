import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { ALLOW_ALL_STORES_KEY } from '../decorators/allow-all-stores.decorator.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { AuthenticatedUser } from '../types/authenticated-user.js';
import {
  runWithStoreSelection,
  type StoreContextSelection,
} from '../../stores/lib/store-context.js';
import { STORE_ALL, StoresService } from '../../stores/stores.service.js';

@Injectable()
export class StoreInterceptor implements NestInterceptor {
  constructor(
    private readonly storesService: StoresService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return next.handle();
    }

    const req = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      headers: Record<string, string | undefined>;
    }>();
    const user = req.user;
    const headerValue = req.headers['x-store-id'];

    const selection: StoreContextSelection =
      await this.storesService.resolveStore(user, headerValue);

    if (selection.all) {
      const allowAll = this.reflector.getAllAndOverride<boolean>(
        ALLOW_ALL_STORES_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (!allowAll) {
        throw new BadRequestException({
          code: STORE_ALL,
          message: 'X-Store-Id: all is only allowed on read-only endpoints',
        });
      }
    }

    return new Observable((subscriber) => {
      runWithStoreSelection(selection, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
