import { Controller, Get, Put, Post, Body } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator.js';
import { TelegramService } from './telegram.service.js';
import { SecretsService } from '../secrets/secrets.service.js';
import { SettingsService } from '../settings/settings.service.js';

export class UpdateTelegramTokenDto {
  @IsString()
  @MinLength(1)
  token!: string;
}

@Controller('settings')
export class TelegramController {
  constructor(
    private readonly telegram: TelegramService,
    private readonly secrets: SecretsService,
    private readonly settings: SettingsService,
  ) {}

  @Get('telegram')
  @RequirePermissions('settings.manage')
  async getTelegramStatus() {
    const isTokenSet = await this.telegram.isTokenSet();
    const { telegramChatId } = await this.settings.get();
    return {
      isTokenSet,
      telegramChatId: telegramChatId || null,
    };
  }

  @Put('telegram-token')
  @RequirePermissions('settings.manage')
  async updateToken(@Body() dto: UpdateTelegramTokenDto) {
    await this.secrets.set('TELEGRAM_BOT_TOKEN', dto.token.trim());
    return { isTokenSet: true };
  }

  @Post('telegram/test')
  @RequirePermissions('settings.manage')
  async testMessage() {
    return this.telegram.sendTestMessage();
  }
}
