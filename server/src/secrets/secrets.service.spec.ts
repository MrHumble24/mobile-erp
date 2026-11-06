import { randomBytes } from 'node:crypto';
import { AppKeyService } from './app-key.service.js';
import { SecretsService } from './secrets.service.js';
import type { SecretsRepository } from './secrets.repository.js';

/** In-memory stand-in for the Prisma repo. */
function fakeRepo() {
  const store = new Map<string, Buffer>();
  return {
    store,
    upsert: jest.fn((name: string, sealed: Buffer) => {
      store.set(name, sealed);
      return Promise.resolve();
    }),
    getSealed: jest.fn((name: string) =>
      Promise.resolve(store.get(name) ?? null),
    ),
    exists: jest.fn((name: string) => Promise.resolve(store.has(name))),
    delete: jest.fn((name: string) => {
      store.delete(name);
      return Promise.resolve();
    }),
  } as unknown as SecretsRepository & { store: Map<string, Buffer> };
}

describe('SecretsService', () => {
  const key = randomBytes(32);
  const appKey = { getKey: () => key } as AppKeyService;

  it('seals on set and reads back the value', async () => {
    const repo = fakeRepo();
    const svc = new SecretsService(repo, appKey);
    await svc.set('backup.passphrase', 'hunter2');
    // Stored value is sealed, not the plaintext.
    expect(repo.store.get('backup.passphrase')!.toString('utf8')).not.toContain(
      'hunter2',
    );
    expect(await svc.read('backup.passphrase')).toBe('hunter2');
  });

  it('reports set / not set and returns null for a missing secret', async () => {
    const svc = new SecretsService(fakeRepo(), appKey);
    expect(await svc.isSet('nope')).toBe(false);
    expect(await svc.read('nope')).toBeNull();
    await svc.set('nope', 'x');
    expect(await svc.isSet('nope')).toBe(true);
  });

  it('cannot read a value sealed under a different master key', async () => {
    const repo = fakeRepo();
    const svc = new SecretsService(repo, appKey);
    await svc.set('k', 'v');
    const other = new SecretsService(repo, {
      getKey: () => randomBytes(32),
    } as AppKeyService);
    await expect(other.read('k')).rejects.toThrow();
  });
});
