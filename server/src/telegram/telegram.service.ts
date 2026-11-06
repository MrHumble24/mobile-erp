import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service.js';
import { SecretsService } from '../secrets/secrets.service.js';

const TELEGRAM_BOT_TOKEN_SECRET = 'provider.telegram.bot_token';

/**
 * Posts plain-text messages to a Telegram chat. No-ops (never throws) when the
 * bot token or chat id is missing, so a misconfigured bot never breaks a sale.
 */
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private warnedMissing = false;

  constructor(
    private readonly settings: SettingsService,
    private readonly secrets: SecretsService,
  ) {}

  async getToken(): Promise<string | null> {
    const state = await this.secrets.state(TELEGRAM_BOT_TOKEN_SECRET);
    if (state === 'set') {
      const stored = await this.secrets.read(TELEGRAM_BOT_TOKEN_SECRET);
      if (stored?.trim()) return stored.trim();
    }
    const env = process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (env) return env;
    if (state === 'unreadable') {
      throw new BadRequestException(
        'Telegram bot token cannot be decrypted with the current master key; please type it again',
      );
    }
    return null;
  }

  async isTokenSet(): Promise<boolean> {
    const state = await this.secrets.state(TELEGRAM_BOT_TOKEN_SECRET);
    if (state === 'set') return true;
    if (process.env.TELEGRAM_BOT_TOKEN?.trim()) return true;
    return false;
  }

  async sendTestMessage(): Promise<{ success: boolean }> {
    const token = await this.getToken();
    const { telegramChatId } = await this.settings.get();
    if (!token) {
      throw new BadRequestException('Telegram bot token is not configured');
    }
    if (!telegramChatId) {
      throw new BadRequestException(
        'Telegram chat ID is not configured in settings',
      );
    }

    const text =
      'Test message from Malika ERP: Telegram alerts are working properly.';
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: telegramChatId, text }),
        },
      );
      if (!res.ok) {
        throw new BadRequestException(
          `Telegram API returned status ${res.status}`,
        );
      }
      return { success: true };
    } catch (err: unknown) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Failed to reach Telegram API');
    }
  }

  async send(text: string): Promise<void> {
    let token: string | null = null;
    try {
      token = await this.getToken();
    } catch {
      this.logger.warn('Telegram bot token is unreadable; skipping send');
      return;
    }
    const { telegramChatId } = await this.settings.get();
    if (!token || !telegramChatId) {
      if (!this.warnedMissing) {
        this.logger.debug(
          'Telegram not configured (token/chatId missing); skipping',
        );
        this.warnedMissing = true;
      }
      return;
    }
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: telegramChatId, text }),
        },
      );
      if (!res.ok) {
        this.logger.warn(
          `Telegram sendMessage failed with status ${res.status}`,
        );
      }
    } catch {
      this.logger.warn('Telegram sendMessage request failed');
    }
  }
}
