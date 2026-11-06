import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ProvidersService } from './providers.service.js';
import { ProviderAuthError } from '../storage/lib/provider-http.js';
import {
  BACKUP_CHAT_IS_STAFF_CHAT,
  PROVIDER_LOCAL_LOCKED,
  PROVIDER_NOT_CONNECTED,
  PROVIDER_STATUS,
} from '../types/backup.types.js';

function make(over: { connected?: boolean; staffChats?: string[] } = {}) {
  const repo = {
    listConfigs: jest.fn().mockResolvedValue([]),
    getConfig: jest.fn().mockResolvedValue({
      providerCode: 'TELEGRAM',
      enabled: false,
      config: { chatId: '42' },
      statusCode: 'OK',
      lastSuccessAt: null,
      lastError: null,
    }),
    setEnabled: jest.fn().mockResolvedValue({}),
    mergeConfig: jest.fn().mockResolvedValue({}),
    setStatus: jest.fn().mockResolvedValue({}),
    disconnect: jest.fn().mockResolvedValue({}),
    storeAlertChatIds: jest.fn().mockResolvedValue(over.staffChats ?? []),
  };
  const backupsRepo = {
    listProviders: jest
      .fn()
      .mockResolvedValue([{ code: 'TELEGRAM', label: 'Telegram' }]),
  };
  const registry = {
    has: () => true,
    get: () => ({
      capabilities: {
        list: false,
        download: true,
        delete: false,
        maxPartBytes: 1,
      },
    }),
  };
  const secrets = {
    kinds: () => ['botToken'],
    state: jest.fn().mockResolvedValue('set'),
    set: jest.fn(),
    clear: jest.fn(),
  };
  const destination = { resolve: jest.fn() };
  // `connected` for TELEGRAM = botToken set + chatId present.
  if (over.connected === false)
    secrets.state = jest.fn().mockResolvedValue('missing');
  const svc = new ProvidersService(
    repo as never,
    backupsRepo as never,
    registry as never,
    secrets as never,
    destination as never,
  );
  return { svc, repo };
}

describe('ProvidersService', () => {
  it('place views carry no secret values', async () => {
    const { svc } = make();
    const places = await svc.listPlaces();
    const text = JSON.stringify(places);
    for (const word of [
      'botToken',
      'token',
      'clientSecret',
      'refreshToken',
      'password',
    ]) {
      expect(text).not.toContain(word);
    }
  });

  it('refuses to switch LOCAL off', async () => {
    const { svc } = make();
    await expect(svc.setEnabled('LOCAL', false)).rejects.toMatchObject({
      response: { code: PROVIDER_LOCAL_LOCKED },
    });
    await expect(svc.setEnabled('LOCAL', false)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('will not switch a place on until it is connected', async () => {
    const { svc } = make({ connected: false });
    await expect(svc.setEnabled('TELEGRAM', true)).rejects.toMatchObject({
      response: { code: PROVIDER_NOT_CONNECTED },
    });
  });

  it('switches a connected place on', async () => {
    const { svc, repo } = make({ connected: true });
    await svc.setEnabled('TELEGRAM', true);
    expect(repo.setEnabled).toHaveBeenCalledWith('TELEGRAM', true);
  });

  it('refuses a backup chat that is a shop staff chat', async () => {
    const { svc } = make({ staffChats: ['42'] });
    await expect(
      svc.setSettings('TELEGRAM', { chatId: '42' }),
    ).rejects.toMatchObject({
      response: { code: BACKUP_CHAT_IS_STAFF_CHAT },
    });
  });

  it('records an auth failure as needs-reconnect', async () => {
    const { svc, repo } = make();
    await svc.recordResult('TELEGRAM', false, new ProviderAuthError('revoked'));
    expect(repo.setStatus).toHaveBeenCalledWith(
      'TELEGRAM',
      PROVIDER_STATUS.NEEDS_RECONNECT,
      expect.anything(),
    );
  });

  it('records success as OK', async () => {
    const { svc, repo } = make();
    await svc.recordResult('TELEGRAM', true);
    expect(repo.setStatus).toHaveBeenCalledWith(
      'TELEGRAM',
      PROVIDER_STATUS.OK,
      expect.anything(),
    );
  });

  it('setSecret rejects an unknown or refresh-token kind', async () => {
    const { svc } = make();
    await expect(
      svc.setSecret('TELEGRAM', 'refreshToken', 'x'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
