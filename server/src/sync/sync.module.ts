import { Module } from '@nestjs/common';
import { ConsignmentsModule } from '../consignments/consignments.module.js';
import { PartnersModule } from '../partners/partners.module.js';
import { SalesModule } from '../sales/sales.module.js';
import { ConsignmentCreateHandler } from './handlers/consignment-create.handler.js';
import { ConsignmentReturnHandler } from './handlers/consignment-return.handler.js';
import { ConsignmentSettleHandler } from './handlers/consignment-settle.handler.js';
import { SaleCreateHandler } from './handlers/sale-create.handler.js';
import { SyncHandlerRegistry } from './handlers/handler-registry.js';
import { SyncChangesRepository } from './sync-changes.repository.js';
import { SyncChangesService } from './sync-changes.service.js';
import { SyncConflictsService } from './sync-conflicts.service.js';
import { SyncController } from './sync.controller.js';
import { SyncRepository } from './sync.repository.js';
import { SyncService } from './sync.service.js';

@Module({
  imports: [SalesModule, ConsignmentsModule, PartnersModule],
  controllers: [SyncController],
  providers: [
    SyncService,
    SyncConflictsService,
    SyncChangesService,
    SyncRepository,
    SyncChangesRepository,
    SyncHandlerRegistry,
    SaleCreateHandler,
    ConsignmentCreateHandler,
    ConsignmentSettleHandler,
    ConsignmentReturnHandler,
  ],
})
export class SyncModule {}
