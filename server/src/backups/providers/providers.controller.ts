import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js';
import {
  SetEnabledDto,
  SetPlaceSecretDto,
  SetPlaceSettingsDto,
} from './dto/place.dto.js';
import { ProvidersService } from './providers.service.js';
import type { PlaceView } from './types/provider.types.js';

/** Manage the backup storage places (handoff 023 PART 3/4). Company-wide, same
 * permissions as the rest: `backup.read` to look, `backup.manage` to change. */
@Controller('backups/places')
export class ProvidersController {
  constructor(private readonly providers: ProvidersService) {}

  @Get()
  @RequirePermissions('backup.read')
  list(): Promise<PlaceView[]> {
    return this.providers.listPlaces();
  }

  @Put(':code/enabled')
  @RequirePermissions('backup.manage')
  setEnabled(
    @Param('code') code: string,
    @Body() dto: SetEnabledDto,
  ): Promise<PlaceView> {
    return this.providers.setEnabled(code, dto.enabled);
  }

  @Put(':code/settings')
  @RequirePermissions('backup.manage')
  setSettings(
    @Param('code') code: string,
    @Body() dto: SetPlaceSettingsDto,
  ): Promise<PlaceView> {
    return this.providers.setSettings(code, dto);
  }

  @Put(':code/secret')
  @HttpCode(204)
  @RequirePermissions('backup.manage')
  async setSecret(
    @Param('code') code: string,
    @Body() dto: SetPlaceSecretDto,
  ): Promise<void> {
    await this.providers.setSecret(code, dto.kind, dto.value);
  }

  @Post(':code/test')
  @RequirePermissions('backup.manage')
  test(@Param('code') code: string): Promise<PlaceView> {
    return this.providers.test(code);
  }

  @Post(':code/disconnect')
  @RequirePermissions('backup.manage')
  disconnect(@Param('code') code: string): Promise<PlaceView> {
    return this.providers.disconnect(code);
  }
}
