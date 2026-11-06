import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CompanyRepository } from './company.repository.js';
import { CompanyService } from './company.service.js';
import { CompanyController } from './company.controller.js';
import { BrandingController } from './branding.controller.js';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [CompanyController, BrandingController],
  providers: [CompanyRepository, CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
