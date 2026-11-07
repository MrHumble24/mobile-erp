import { Injectable } from '@nestjs/common';
import { ConsignmentCreateHandler } from './consignment-create.handler.js';
import { ConsignmentReturnHandler } from './consignment-return.handler.js';
import { ConsignmentSettleHandler } from './consignment-settle.handler.js';
import {
  RepairCreateHandler,
  RepairOutsideHandler,
  RepairPartAddHandler,
  RepairPartRemoveHandler,
  RepairPaymentHandler,
  RepairRefundHandler,
  RepairStatusHandler,
  RepairUpdateHandler,
} from './repair.handlers.js';
import { SaleCreateHandler } from './sale-create.handler.js';
import type { SyncHandler } from './sync-handler.interface.js';

/** Maps a mutation type to its handler. Add a type = add a file + one entry. */
@Injectable()
export class SyncHandlerRegistry {
  private readonly handlers: Map<string, SyncHandler>;

  constructor(
    saleCreate: SaleCreateHandler,
    consignmentCreate: ConsignmentCreateHandler,
    consignmentSettle: ConsignmentSettleHandler,
    consignmentReturn: ConsignmentReturnHandler,
    repairCreate: RepairCreateHandler,
    repairUpdate: RepairUpdateHandler,
    repairStatus: RepairStatusHandler,
    repairPayment: RepairPaymentHandler,
    repairRefund: RepairRefundHandler,
    repairOutside: RepairOutsideHandler,
    repairPartAdd: RepairPartAddHandler,
    repairPartRemove: RepairPartRemoveHandler,
  ) {
    this.handlers = new Map<string, SyncHandler>([
      ['sale.create', saleCreate],
      ['consignment.create', consignmentCreate],
      ['consignment.settle', consignmentSettle],
      ['consignment.return', consignmentReturn],
      ['repair.create', repairCreate],
      ['repair.update', repairUpdate],
      ['repair.status', repairStatus],
      ['repair.payment', repairPayment],
      ['repair.refund', repairRefund],
      ['repair.outside', repairOutside],
      ['repair.part.add', repairPartAdd],
      ['repair.part.remove', repairPartRemove],
    ]);
  }

  get(type: string): SyncHandler | undefined {
    return this.handlers.get(type);
  }
}
