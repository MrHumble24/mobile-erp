import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { StoresService } from '../stores/stores.service.js';
import { LedgerRepository } from './ledger.repository.js';
import { foldSourceNets, sumAccountNets } from './lib/source-nets.js';

/**
 * Repair-specific derived reads over the cash ledger (ADR 0040): how much the
 * shop has paid an outside master, summed from REPAIR_OUTSIDE rows (money out,
 * stored negative) and returned positive. Kept out of LedgerService so neither
 * file grows past its size limit; still the only ledger reader is the repo.
 */
@Injectable()
export class LedgerRepairReadService {
  constructor(
    private readonly repo: LedgerRepository,
    private readonly stores: StoresService,
  ) {}

  /** Net paid to the outside master per ticket, as a positive amount. */
  async outsidePaid(ids: string[]): Promise<Map<string, Prisma.Decimal>> {
    const rows = await this.repo.groupBySource(
      'repairId',
      ['REPAIR_OUTSIDE'],
      ids,
    );
    const nets = foldSourceNets('repairId', rows);
    return new Map(
      [...nets].map(([id, l]) => [id, sumAccountNets(l).negated()]),
    );
  }

  /** Total paid to outside masters in [from, to] for the current store. */
  async outsideSum(from?: Date, to?: Date): Promise<Prisma.Decimal> {
    const storeId = await this.stores.currentStoreId();
    const sum = await this.repo.sumType(storeId, 'REPAIR_OUTSIDE', from, to);
    return sum.negated();
  }
}
