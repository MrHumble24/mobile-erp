import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { ResolveConflictDto } from './dto/resolve-conflict.dto.js';
import { SyncHandlerRegistry } from './handlers/handler-registry.js';
import { errorMessage } from './lib/error-message.js';
import { validateDto } from './lib/validate-dto.js';
import { SyncRepository } from './sync.repository.js';
import type { ConflictView } from './types/sync.types.js';

/**
 * Lists and resolves offline sync conflicts. There is no force path: keep-server
 * just records the decision; apply-terminal re-dispatches the stored mutation at
 * the device's current version and, if it still clashes, leaves it pending (409).
 */
@Injectable()
export class SyncConflictsService {
  constructor(
    private readonly repo: SyncRepository,
    private readonly registry: SyncHandlerRegistry,
  ) {}

  listPending(): Promise<ConflictView[]> {
    return this.repo.listPending();
  }

  async resolve(
    caller: AuthenticatedUser,
    id: string,
    dto: ResolveConflictDto,
  ): Promise<ConflictView> {
    const conflict = await this.repo.findForResolve(id);
    if (!conflict) throw new NotFoundException(`Conflict ${id} not found`);
    if (conflict.resolvedAt) {
      throw new ConflictException(`Conflict ${id} is already resolved`);
    }

    if (dto.resolution === 'apply-terminal') {
      await this.replay(caller, conflict.deviceId, conflict.attemptedChange);
    }
    return this.repo.resolve(id, {
      resolvedById: caller.id,
      resolution: dto.resolution,
    });
  }

  /** Re-runs the stored mutation at the device's current version. Throws 409 on clash. */
  private async replay(
    caller: AuthenticatedUser,
    deviceId: string,
    attempted: {
      type: string;
      payload: Record<string, unknown>;
      mutationId: string;
    },
  ): Promise<void> {
    const handler = this.registry.get(attempted.type);
    if (!handler) {
      throw new ConflictException(`Unknown mutation type ${attempted.type}`);
    }
    const version = await this.repo.currentDeviceVersion(deviceId);
    if (version === null) {
      throw new ConflictException(`Device ${deviceId} no longer exists`);
    }
    const dto = await validateDto(handler.dtoClass, attempted.payload);
    try {
      await handler.apply(
        { caller, mutationId: attempted.mutationId, baseVersion: version },
        dto,
      );
    } catch (error) {
      throw new ConflictException(errorMessage(error));
    }
  }
}
