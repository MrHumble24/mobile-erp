import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AllowDuringMaintenance } from '../common/decorators/allow-during-maintenance.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { ConfirmRestoreDto } from './dto/confirm-restore.dto.js';
import { streamToTempFile } from './lib/upload-intake.js';
import { RestoreService } from './restore.service.js';

/**
 * Restore the whole system (`backup.restore`). Both routes re-check the shop
 * name and the caller's password. Rate limited: a restore is heavy and
 * destructive. ADR 0045: company-wide, no store scope.
 */
@Controller('backups')
export class RestoreController {
  constructor(private readonly restore: RestoreService) {}

  @Get('restore/status')
  @AllowDuringMaintenance()
  @RequirePermissions('backup.read')
  status() {
    return { restoring: this.restore.isRestoring() };
  }

  @Post(':id/restore')
  @HttpCode(202)
  @RequirePermissions('backup.restore')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async fromList(
    @Param('id') id: string,
    @Body() dto: ConfirmRestoreDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ ok: true }> {
    await this.restore.restore({
      performedById: user.id,
      email: user.email,
      shopName: dto.shopName,
      password: dto.password,
      source: { runId: id },
    });
    return { ok: true };
  }

  /**
   * Restore from an uploaded `.mbk`. The body is the raw encrypted file
   * (`application/octet-stream`), streamed to disk (never buffered in memory);
   * the shop name and password come in headers so they are not parsed from the
   * body. Headers over HTTPS, never logged.
   */
  @Post('restore-upload')
  @HttpCode(202)
  @RequirePermissions('backup.restore')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async fromUpload(
    @Req() req: Request,
    @Headers('x-restore-shop-name') shopName: string,
    @Headers('x-restore-password') password: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ ok: true }> {
    const intake = await streamToTempFile(req);
    try {
      await this.restore.restore({
        performedById: user.id,
        email: user.email,
        shopName: shopName ?? '',
        password: password ?? '',
        source: { uploadPath: intake.path, label: 'uploaded.mbk' },
      });
      return { ok: true };
    } finally {
      await intake.cleanup();
    }
  }
}
