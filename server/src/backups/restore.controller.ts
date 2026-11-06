import {
  Body,
  Controller,
  Get,
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
import { RestoreService } from './restore.service.js';
import {
  UploadStagingService,
  type StagedUpload,
} from './upload-staging.service.js';

/**
 * Restore the whole system (`backup.restore`). Every path re-checks the shop
 * name and the caller's password. Rate limited: a restore is heavy and
 * destructive. ADR 0045: company-wide, no store scope.
 */
@Controller('backups')
export class RestoreController {
  constructor(
    private readonly restore: RestoreService,
    private readonly uploads: UploadStagingService,
  ) {}

  @Get('restore/status')
  @AllowDuringMaintenance()
  @RequirePermissions('backup.read')
  status() {
    return this.restore.status();
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
   * Step 1 of an upload restore (A7): stream the raw `.mbk` body
   * (`application/octet-stream`) to owner-only staging, verify it, and return a
   * handle. Credentials come in step 2's JSON body, not in headers.
   */
  @Post('uploads')
  @RequirePermissions('backup.restore')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  stageUpload(@Req() req: Request): Promise<StagedUpload> {
    return this.uploads.stage(req);
  }

  /** Step 2: restore from a staged upload with the usual confirmation body. */
  @Post('uploads/:uploadId/restore')
  @HttpCode(202)
  @RequirePermissions('backup.restore')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async fromUpload(
    @Param('uploadId') uploadId: string,
    @Body() dto: ConfirmRestoreDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ ok: true }> {
    const uploadPath = this.uploads.pathOf(uploadId);
    try {
      await this.restore.restore({
        performedById: user.id,
        email: user.email,
        shopName: dto.shopName,
        password: dto.password,
        source: { uploadPath, label: `upload:${uploadId}` },
      });
      return { ok: true };
    } finally {
      await this.uploads.remove(uploadId);
    }
  }
}
