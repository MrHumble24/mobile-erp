import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AllowDuringMaintenance } from '../common/decorators/allow-during-maintenance.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { WipeRequestDto } from './dto/wipe-request.dto.js';
import { DataWipeService } from './data-wipe.service.js';

/**
 * Danger zone: erase the shop's data (`data.wipe`, owner only). Company-wide
 * like `/backups` (ADR 0045): no store scope. The confirmation (shop name,
 * password, "I understand") is re-checked in the service; POST is rate limited
 * because it is heavy and destructive.
 */
@Controller('data-wipe')
export class DataWipeController {
  constructor(private readonly wipe: DataWipeService) {}

  @Get('preview')
  @RequirePermissions('data.wipe')
  preview() {
    return this.wipe.preview();
  }

  @Get('status')
  @AllowDuringMaintenance()
  @RequirePermissions('data.wipe')
  status() {
    return this.wipe.status();
  }

  @Get('runs')
  @RequirePermissions('data.wipe')
  runs() {
    return this.wipe.runs();
  }

  @Post()
  @HttpCode(202)
  @RequirePermissions('data.wipe')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async erase(
    @Body() dto: WipeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ ok: true }> {
    await this.wipe.wipe({
      performedById: user.id,
      email: user.email,
      shopName: dto.shopName,
      password: dto.password,
      contacts: dto.contacts,
      catalog: dto.catalog,
    });
    return { ok: true };
  }
}
