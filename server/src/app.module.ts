import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AccessModule } from './access/access.module.js';
import { UsersModule } from './users/users.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { PermissionsGuard } from './common/guards/permissions.guard.js';
import { CostRedactionInterceptor } from './common/interceptors/cost-redaction.interceptor.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    HealthModule,
    AuthModule,
    AccessModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: CostRedactionInterceptor },
  ],
})
export class AppModule {}
