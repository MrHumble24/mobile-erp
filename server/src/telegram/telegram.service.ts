import { Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service.js';

/**
 * Posts plain-text messages to a Telegram chat. No-ops (never throws) when the
 * bot token or chat id is missing, so a misconfigured bot never breaks a sale.
 */
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private warnedMissing = false;

  constructor(private readonly settings: SettingsService) {}

  async send(text: string, storeId?: string): Promise<void> {
    try {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const { telegramChatId } = await this.settings.get(storeId);
      if (!token || !telegramChatId) {
        if (!this.warnedMissing) {
          this.logger.debug(
            'Telegram not configured (token/chatId missing); skipping',
          );
          this.warnedMissing = true;
        }
        return;
      }
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
