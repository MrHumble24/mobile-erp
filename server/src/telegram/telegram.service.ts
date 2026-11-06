import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service.js';
import { SecretsService } from '../secrets/secrets.service.js';

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
    const stored = await this.secrets.get('TELEGRAM_BOT_TOKEN');
    if (stored?.trim()) return stored.trim();
    const env = process.env.TELEGRAM_BOT_TOKEN?.trim();
    return env || null;
  }

  async isTokenSet(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
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
        const body = await res.text().catch(() => '');
        throw new BadRequestException(
          `Telegram API error (${res.status}): ${body}`,
        );
      }
      return { success: true };
    } catch (err: unknown) {
      if (err instanceof BadRequestException) throw err;
      const msg = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(`Failed to reach Telegram API: ${msg}`);
    }
  }

  async send(text: string): Promise<void> {
    const token = await this.getToken();
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
        this.logger.warn(`Telegram sendMessage failed: ${res.status}`);
      }
    } catch (error) {
      this.logger.warn(`Telegram sendMessage error: ${String(error)}`);
    }
  }
}
