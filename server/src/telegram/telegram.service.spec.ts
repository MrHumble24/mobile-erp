import { SettingsService } from '../settings/settings.service.js';
import { TelegramService } from './telegram.service.js';

function build(
  telegramChatId: string | null,
  secretToken: string | null = null,
  secretState: 'set' | 'missing' | 'unreadable' = secretToken
    ? 'set'
    : 'missing',
) {
  const settings = {
    get: jest.fn().mockResolvedValue({ telegramChatId }),
  };
  const secrets = {
    state: jest.fn().mockResolvedValue(secretState),
    read: jest.fn().mockResolvedValue(secretToken),
  };
  const service = new TelegramService(
    settings as unknown as SettingsService,
    secrets as any,
  );
  return { service, settings, secrets };
}

describe('TelegramService.send', () => {
  const originalToken = process.env.TELEGRAM_BOT_TOKEN;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;
  });

  afterEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = originalToken;
  });

  it('no-ops (no fetch) when the bot token is missing', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const { service } = build('chat-1');
    await service.send('hi');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('no-ops when the chat id is missing', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'token';
    const { service } = build(null);
    await service.send('hi');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts to the Telegram API when both are configured', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'token';
    const { service } = build('chat-1');
    await service.send('hi');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.telegram.org/bottoken/sendMessage',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('prefers secrets store over env value for bot token', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'env-token';
    const { service } = build('chat-1', 'secret-token');
    await service.send('hi');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.telegram.org/botsecret-token/sendMessage',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('C5: does not leak bot token or raw url in logs or error messages', async () => {
    fetchMock.mockRejectedValue(
      new Error(
        'fetch failed: https://api.telegram.org/botsecret-token/sendMessage',
      ),
    );
    const { service } = build('chat-1', 'secret-token');

    // send should not throw and should not log the raw URL
    const warnSpy = jest.spyOn((service as any).logger, 'warn');
    await service.send('hi');
    expect(warnSpy).toHaveBeenCalledWith('Telegram sendMessage request failed');

    // sendTestMessage should throw generic error without token
    await expect(service.sendTestMessage()).rejects.toThrow(
      'Failed to reach Telegram API',
    );
  });

  it('handles unreadable token in sendTestMessage by asking user to re-enter', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    const { service } = build('chat-1', null, 'unreadable');
    await expect(service.sendTestMessage()).rejects.toThrow(
      'Telegram bot token cannot be decrypted with the current master key; please type it again',
    );
  });
});
