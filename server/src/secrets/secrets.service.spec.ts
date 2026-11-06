import { rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SecretsService } from './secrets.service.js';

describe('SecretsService', () => {
  let service: SecretsService;
  const testDataDir = join(process.cwd(), 'test-data-secrets');
  const mockSecrets = new Map<string, string>();

  const mockPrisma = {
    appSecret: {
      findUnique: jest.fn(({ where: { name } }) => {
        const val = mockSecrets.get(name);
        return Promise.resolve(val ? { name, value: val } : null);
      }),
      upsert: jest.fn(({ where: { name }, create, update }) => {
        const val = create?.value || update?.value;
        mockSecrets.set(name, val);
        return Promise.resolve({ name, value: val });
      }),
      deleteMany: jest.fn(({ where: { name } }) => {
        mockSecrets.delete(name);
        return Promise.resolve({ count: 1 });
      }),
    },
  } as any;

  beforeEach(() => {
    process.env.DATA_DIR = testDataDir;
    delete process.env.MASTER_KEY;
    mockSecrets.clear();
    service = new SecretsService(mockPrisma);
  });

  afterAll(() => {
    if (existsSync(testDataDir)) {
      rmSync(testDataDir, { recursive: true, force: true });
    }
    delete process.env.DATA_DIR;
  });

  it('generates master key file if missing and encrypts/decrypts symmetrically', () => {
    const key = service.initMasterKey();
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);

    const plaintext = 'super-secret-telegram-bot-token-12345';
    const encrypted = service.encrypt(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.split(':')).toHaveLength(3);

    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('stores, tests and retrieves secret via mock database', async () => {
    expect(await service.isSet('TEST_KEY')).toBe(false);
    expect(await service.get('TEST_KEY')).toBeNull();

    await service.set('TEST_KEY', 'my-secret-value');
    expect(await service.isSet('TEST_KEY')).toBe(true);

    const retrieved = await service.get('TEST_KEY');
    expect(retrieved).toBe('my-secret-value');

    await service.delete('TEST_KEY');
    expect(await service.isSet('TEST_KEY')).toBe(false);
    expect(await service.get('TEST_KEY')).toBeNull();
  });
});
