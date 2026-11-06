import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SecretsService } from './secrets.service.js';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [SecretsService],
  exports: [SecretsService],
})
export class SecretsModule {}
