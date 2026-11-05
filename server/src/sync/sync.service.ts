import { ConflictException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { runWithStoreSelection } from '../stores/lib/store-context.js';
import { StoresService } from '../stores/stores.service.js';
import { MutationDto, PushDto } from './dto/push.dto.js';
import { SyncHandlerRegistry } from './handlers/handler-registry.js';
import type {
  MutationContext,
  SyncHandler,
} from './handlers/sync-handler.interface.js';
import { errorMessage } from './lib/error-message.js';
import { validateDto } from './lib/validate-dto.js';
import { SyncRepository } from './sync.repository.js';
import type { MutationResult, PushResponse } from './types/sync.types.js';

/**
 * Applies a terminal's offline mutation queue in order. Each mutation is
 * permission-checked, validated, then dispatched to the owning service; a
 * version/state clash becomes a logged conflict, any other error a rejection.
 * Rejected mutations are never persisted.
 */
@Injectable()
export class SyncService {
  constructor(
    private readonly registry: SyncHandlerRegistry,
    private readonly repo: SyncRepository,
    private readonly stores: StoresService,
  ) {}

  async push(caller: AuthenticatedUser, dto: PushDto): Promise<PushResponse> {
    const results: MutationResult[] = [];
    for (const mutation of dto.mutations) {
      results.push(await this.dispatch(caller, dto.terminalId, mutation));
    }
    return { results };
  }

  private async dispatch(
    caller: AuthenticatedUser,
    terminalId: string,
    mutation: MutationDto,
  ): Promise<MutationResult> {
    const handler = this.registry.get(mutation.type);
    if (!handler) {
      return reject(mutation.id, `Unknown mutation type ${mutation.type}`);
    }
    if (!caller.permissions.has(handler.permission)) {
      return reject(mutation.id, `Forbidden: requires ${handler.permission}`);
    }

    const allowed = await this.stores.allowedStoreIds(caller);
    let targetStoreId: string;
    if (mutation.storeId) {
      if (!allowed.includes(mutation.storeId)) {
        return reject(mutation.id, 'STORE_FORBIDDEN');
      }
      targetStoreId = mutation.storeId;
    } else {
      if (allowed.length > 1) {
        return reject(mutation.id, 'STORE_REQUIRED');
      }
      if (allowed.length === 1) {
        targetStoreId = allowed[0];
      } else {
        return reject(mutation.id, 'STORE_FORBIDDEN');
      }
    }

    let dto: object;
    try {
      dto = await validateDto(handler.dtoClass, mutation.payload);
    } catch (error) {
      return reject(mutation.id, errorMessage(error));
    }

    const ctx: MutationContext = {
      caller,
      mutationId: mutation.id,
      baseVersion: mutation.baseVersion,
    };
    const existing = await handler.findExisting(ctx, dto);
    if (existing) {
      return { id: mutation.id, status: 'duplicate', record: existing };
    }
    return this.apply(handler, ctx, dto, terminalId, mutation, targetStoreId);
  }

  private async apply(
    handler: SyncHandler,
    ctx: MutationContext,
    dto: object,
    terminalId: string,
    mutation: MutationDto,
    targetStoreId: string,
  ): Promise<MutationResult> {
    try {
      const runner = () =>
        runWithStoreSelection({ all: false, storeIds: [targetStoreId] }, () =>
          handler.apply(ctx, dto),
        );
      const record = await runner();
      return { id: mutation.id, status: 'applied', record };
    } catch (error) {
      if (error instanceof ConflictException) {
        const conflictId = await this.logConflict(
          handler,
          dto,
          terminalId,
          mutation,
        );
        if (conflictId) {
          return { id: mutation.id, status: 'conflict', conflictId };
        }
      }
      return reject(mutation.id, errorMessage(error));
    }
  }

  private async logConflict(
    handler: SyncHandler,
    dto: object,
    terminalId: string,
    mutation: MutationDto,
  ): Promise<string | null> {
    const deviceId = await handler.deviceId(dto);
    if (!deviceId) return null;
    const { id } = await this.repo.insertConflict({
      deviceId,
      terminalId,
      attemptedChange: {
        type: mutation.type,
        payload: mutation.payload,
        occurredAt: mutation.occurredAt,
        mutationId: mutation.id,
      },
      baseVersion: mutation.baseVersion ?? 0,
    });
    return id;
  }
}

function reject(id: string, error: string): MutationResult {
  return { id, status: 'rejected', error };
}
