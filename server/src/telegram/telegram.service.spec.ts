import { SettingsService } from '../settings/settings.service.js';
import { TelegramService } from './telegram.service.js';

function build(telegramChatId: string | null) {
  const settings = {
    get: jest.fn().mockResolvedValue({ telegramChatId }),
  };
  const service = new TelegramService(settings as unknown as SettingsService);
  return { service, settings };
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
});
