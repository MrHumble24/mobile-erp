import { Module } from '@nestjs/common';
import { PartnersModule } from '../partners/partners.module.js';
import { ConsignmentsController } from './consignments.controller.js';
import { ConsignmentsRepository } from './consignments.repository.js';
import { ConsignmentsService } from './consignments.service.js';
import { ConsignmentsWriteRepository } from './consignments.write.repository.js';

@Module({
  imports: [PartnersModule],
  controllers: [ConsignmentsController],
  providers: [
    ConsignmentsService,
    ConsignmentsRepository,
    ConsignmentsWriteRepository,
  ],
})
export class ConsignmentsModule {}
