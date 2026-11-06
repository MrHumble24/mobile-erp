import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  StreamableFile,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { BackupsService } from './backups.service.js';
import { SetPassphraseDto } from './dto/set-passphrase.dto.js';
import { UpdateBackupSettingsDto } from './dto/update-backup-settings.dto.js';

/** Company-wide backups (ADR 0045: no store scope). read = look, manage = act. */
@Controller('backups')
export class BackupsController {
  constructor(private readonly backups: BackupsService) {}

  @Get()
  @RequirePermissions('backup.read')
  list() {
    return this.backups.listRuns();
  }

  @Get('settings')
  @RequirePermissions('backup.read')
  getSettings() {
    return this.backups.getSettings();
  }

  @Put('settings')
  @RequirePermissions('backup.manage')
  updateSettings(@Body() dto: UpdateBackupSettingsDto) {
    return this.backups.updateSettings(dto);
  }

  @Put('passphrase')
  @HttpCode(204)
  @RequirePermissions('backup.manage')
  async setPassphrase(@Body() dto: SetPassphraseDto): Promise<void> {
    await this.backups.setPassphrase(dto.passphrase);
  }

  @Get('providers')
  @RequirePermissions('backup.read')
  listProviders() {
    return this.backups.listProviders();
  }

  @Post()
  @RequirePermissions('backup.manage')
  async create(@CurrentUser() user: AuthenticatedUser) {
    await this.backups.startBackup(user.id);
    return this.backups.listRuns();
  }

  @Get(':id/download')
  @RequirePermissions('backup.manage')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async download(@Param('id') id: string): Promise<StreamableFile> {
    const { stream, name, size } = await this.backups.download(id);
    return new StreamableFile(stream, {
      type: 'application/octet-stream',
      disposition: `attachment; filename="${name}"`,
      length: size || undefined,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions('backup.manage')
  async remove(@Param('id') id: string): Promise<void> {
    await this.backups.deleteRun(id);
  }
}
