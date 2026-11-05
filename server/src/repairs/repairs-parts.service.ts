import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { StockService } from '../stock/stock.service.js';
import { StoresService } from '../stores/stores.service.js';
import { AddPartDto } from './dto/add-part.dto.js';
import { isTerminal } from './lib/repair-status.js';
import { RepairsReadService } from './repairs-read.service.js';
import { RepairsRepository } from './repairs.repository.js';
import { RepairsWriteRepository } from './repairs.write.repository.js';
import { REPAIR_TERMINAL } from './repairs.service.js';
import type { RepairView } from './types/repair.types.js';

/** Parts used on a repair, taken from (and returned to) quantity stock (ADR 0040). */
@Injectable()
export class RepairsPartsService {
  constructor(
    private readonly read: RepairsReadService,
    private readonly repo: RepairsRepository,
    private readonly writes: RepairsWriteRepository,
    private readonly stock: StockService,
    private readonly stores: StoresService,
  ) {}

  /** Take `quantity` pieces of a quantity product out of stock for the ticket. */
  async addPart(
    caller: AuthenticatedUser,
    id: string,
    dto: AddPartDto,
  ): Promise<RepairView> {
    await this.read.assertEnabled();
    const raw = await this.assertOpen(id);
    await this.stock.assertQuantityModel(dto.modelId);
    const storeId = await this.stores.currentStoreId();
    await this.writes.transaction(async (tx) => {
      const cost = await this.stock.averageCost(storeId, dto.modelId, tx);
      await this.writes.createPart(tx, {
        repairId: id,
        modelId: dto.modelId,
        quantity: dto.quantity,
        unitCostSnapshot: cost,
        addedById: caller.id,
      });
      await this.stock.postMovement(
        {
          storeId,
          modelId: dto.modelId,
          typeCode: 'REPAIR_USE',
          quantity: -dto.quantity,
          unitCostSnapshot: cost,
          note: `Repair #${raw.ticketNumber}`,
          createdById: caller.id,
        },
        tx,
      );
    });
    return this.read.get(caller, id);
  }

  /** Remove a part before hand-over, putting the pieces back into stock. */
  async removePart(
    caller: AuthenticatedUser,
    id: string,
    partId: string,
  ): Promise<RepairView> {
    await this.read.assertEnabled();
    const raw = await this.assertOpen(id);
    const part = await this.repo.findPartById(id, partId);
    if (!part) throw new NotFoundException(`Part ${partId} not found`);
    const storeId = await this.stores.currentStoreId();
    await this.writes.transaction(async (tx) => {
      await this.stock.postMovement(
        {
          storeId,
          modelId: part.modelId,
          typeCode: 'REPAIR_USE',
          quantity: part.quantity,
          unitCostSnapshot: part.unitCostSnapshot,
          note: `Repair #${raw.ticketNumber} part removed`,
          createdById: caller.id,
        },
        tx,
      );
      await this.writes.deletePart(tx, partId);
    });
    return this.read.get(caller, id);
  }

  private async assertOpen(id: string) {
    const raw = await this.read.require(id);
    if (isTerminal(raw.statusCode)) {
      throw new ConflictException({
        code: REPAIR_TERMINAL,
        message: 'Parts cannot change on a given-back or cancelled ticket',
      });
    }
    return raw;
  }
}
