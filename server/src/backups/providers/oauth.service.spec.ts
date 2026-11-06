import { BadRequestException, ConflictException } from '@nestjs/common';
import { OauthService } from './oauth.service.js';
import {
  OAUTH_NOT_SUPPORTED,
  OAUTH_RETURN_URL_INVALID,
  OAUTH_STATE_INVALID,
  PROVIDER_NOT_CONFIGURED,
} from '../types/backup.types.js';

const RETURN = 'http://localhost:5173/settings/backups';

function make(
  over: { clientId?: string | null; clientSecretSet?: boolean } = {},
) {
  const repo = {
    createOauthState: jest.fn().mockResolvedValue({}),
    consumeOauthState: jest.fn().mockResolvedValue(null),
    deleteExpiredOauthStates: jest.fn().mockResolvedValue({}),
  };
  const secrets = {
    read: jest
      .fn()
      .mockResolvedValue(over.clientId === undefined ? 'cid' : over.clientId),
    state: jest
      .fn()
      .mockResolvedValue(over.clientSecretSet === false ? 'missing' : 'set'),
  };
  const registry = { get: jest.fn() };
  const destination = { resolve: jest.fn() };
  const svc = new OauthService(
    repo as never,
    secrets as never,
    registry as never,
    destination as never,
  );
  return { svc, repo };
}

describe('OauthService.start', () => {
  it('returns a consent URL with the state for a trusted return URL', async () => {
    const { svc, repo } = make();
    const { url } = await svc.start('GOOGLE_DRIVE', 'u1', RETURN);
    expect(url).toContain('accounts.google.com');
    expect(url).toContain('code_challenge');
    expect(repo.createOauthState).toHaveBeenCalledWith(
      expect.objectContaining({
        providerCode: 'GOOGLE_DRIVE',
        userId: 'u1',
        redirectTo: RETURN,
      }),
    );
  });

  it('refuses an untrusted return URL (open redirect)', async () => {
    const { svc, repo } = make();
    await expect(
      svc.start('GOOGLE_DRIVE', 'u1', 'http://evil.example.com/x'),
    ).rejects.toMatchObject({
      response: { code: OAUTH_RETURN_URL_INVALID },
    });
    expect(repo.createOauthState).not.toHaveBeenCalled();
  });

  it('refuses a non-OAuth provider', async () => {
    const { svc } = make();
    await expect(svc.start('TELEGRAM', 'u1', RETURN)).rejects.toMatchObject({
      response: { code: OAUTH_NOT_SUPPORTED },
    });
  });

  it('refuses when the client id/secret are not set', async () => {
    const { svc } = make({ clientId: null });
    await expect(
      svc.start('GOOGLE_DRIVE', 'u1', RETURN),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(svc.start('GOOGLE_DRIVE', 'u1', RETURN)).rejects.toMatchObject(
      {
        response: { code: PROVIDER_NOT_CONFIGURED },
      },
    );
  });
});

describe('OauthService.callback', () => {
  it('refuses an unknown/used/expired state and changes nothing', async () => {
    const { svc } = make(); // consumeOauthState → null
    await expect(
      svc.callback('GOOGLE_DRIVE', 'badstate', 'authcode'),
    ).rejects.toMatchObject({
      response: { code: OAUTH_STATE_INVALID },
    });
  });

  it('rejects with a BadRequest (not a redirect) on an invalid state', async () => {
    const { svc } = make();
    await expect(svc.callback('GOOGLE_DRIVE', 'x', 'y')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
