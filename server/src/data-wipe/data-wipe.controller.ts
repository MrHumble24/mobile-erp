import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AllowDuringMaintenance } from '../common/decorators/allow-during-maintenance.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import {
  RequireAnyPermissions,
  RequirePermissions,
} from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { WipeRequestDto } from './dto/wipe-request.dto.js';
import { ResetRequestDto } from './dto/reset-request.dto.js';
import { DataWipeService } from './data-wipe.service.js';

/**
 * Danger zone: erase the shop's data (`data.wipe`) or factory reset back to the
 * first-boot wizard (`data.reset`, ADMIN only). Company-wide like `/backups`
 * (ADR 0045): no store scope. Confirmation is verified on the server; POST is
 * rate limited because it is heavy and destructive.
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
  @RequireAnyPermissions('data.wipe', 'data.reset')
  status() {
    return this.wipe.status();
  }

  @Get('runs')
  @RequireAnyPermissions('data.wipe', 'data.reset')
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

  @Post('reset')
  @HttpCode(202)
  @RequirePermissions('data.reset')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async reset(
    @Body() dto: ResetRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ ok: true }> {
    await this.wipe.reset({
      performedById: user.id,
      email: user.email,
      shopName: dto.shopName,
      password: dto.password,
      sentence: dto.sentence,
    });
    return { ok: true };
  }
}
