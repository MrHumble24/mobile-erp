import {
  BadRequestException,
  ConflictException,
  HttpStatus,
} from '@nestjs/common';
import { rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SetupService } from './setup.service.js';

describe('SetupService', () => {
  let service: SetupService;
  const testDataDir = join(process.cwd(), 'test-data-setup');
  let userCount = 0;
  let storedUsers: any[] = [];

  const mockPrisma: any = {
    user: {
      count: jest.fn(() => Promise.resolve(userCount)),
    },
    $transaction: jest.fn(async (cb: (tx: any) => Promise<any>) => {
      const tx = {
        $executeRawUnsafe: jest.fn().mockResolvedValue(1),
        user: {
          count: jest.fn(() => Promise.resolve(userCount)),
          create: jest.fn(({ data }) => {
            const u = { id: 'user-owner-1', email: data.email, ...data };
            userCount++;
            storedUsers.push(u);
            return Promise.resolve(u);
          }),
        },
        companyProfile: {
          upsert: jest.fn().mockResolvedValue({ id: 'default' }),
        },
        store: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn(({ data }) =>
            Promise.resolve({ id: 'store-1', ...data }),
          ),
          update: jest.fn(({ data }) =>
            Promise.resolve({ id: 'store-1', ...data }),
          ),
        },
        userStore: {
          upsert: jest.fn().mockResolvedValue({}),
        },
        storeSettings: {
          upsert: jest.fn().mockResolvedValue({}),
        },
      };
      return cb(tx);
    }),
  };

  const mockSecrets: any = {
    set: jest.fn().mockResolvedValue(undefined),
  };

  const mockCompany: any = {
    getSessionDuration: jest.fn().mockResolvedValue('12h'),
  };

  const mockAuth: any = {
    me: jest.fn().mockResolvedValue({
      id: 'user-owner-1',
      email: 'owner@test.uz',
      profile: { firstName: 'Owner' },
      roles: ['ADMIN'],
      permissions: ['*'],
      stores: [{ id: 'store-1', name: 'Test Shop' }],
    }),
  };

  const mockJwt: any = {
    signAsync: jest.fn().mockResolvedValue('mock-access-token-xyz'),
  };

  beforeEach(() => {
    process.env.DATA_DIR = testDataDir;
    userCount = 0;
    storedUsers = [];
    service = new SetupService(
      mockPrisma,
      mockSecrets,
      mockCompany,
      mockAuth,
      mockJwt,
    );
  });

  afterAll(() => {
    if (existsSync(testDataDir)) {
      rmSync(testDataDir, { recursive: true, force: true });
    }
    delete process.env.DATA_DIR;
  });

  it('reports needsSetup accurately based on user count', async () => {
    expect(await service.getStatus()).toEqual({ needsSetup: true });
    userCount = 1;
    expect(await service.getStatus()).toEqual({ needsSetup: false });
  });

  it('generates secure 32-char setup code, stores only SHA-256 hash, and compares in constant time (C3)', () => {
    const code = service.generateAndSaveSetupCode();
    expect(code).toHaveLength(32);
    expect(code).toMatch(/^[0-9A-F]{32}$/);

    const filePath = service.getSetupCodePath();
    const stored = readFileSync(filePath, 'utf8').trim();
    // Stored content is a 64-char SHA-256 hex string, NOT the plain code
    expect(stored).toHaveLength(64);
    expect(stored).not.toEqual(code);

    // Matching code passes constant time check
    expect(service.verifySetupCode(code)).toBe(true);
    expect(service.verifySetupCode(code.toLowerCase())).toBe(true);
    // Wrong code fails
    expect(service.verifySetupCode('WRONG_CODE_HERE')).toBe(false);
  });

  it('rejects wrong setup code and rate limits repeated failures', async () => {
    service.generateAndSaveSetupCode();
    const badDto: any = {
      code: 'WRONG123',
      owner: {
        email: 'owner@test.uz',
        password: 'password123',
        firstName: 'Owner',
      },
      company: { name: 'Test', currencyCode: 'USD', currencySign: '$' },
    };

    // 4 failed attempts throw 400
    for (let i = 0; i < 4; i++) {
      await expect(service.setup(badDto)).rejects.toThrow(BadRequestException);
    }

    // 5th failed attempt throws 400
    await expect(service.setup(badDto)).rejects.toThrow(BadRequestException);

    // 6th attempt is blocked by rate limiter (429)
    await expect(service.setup(badDto)).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
  });

  it('completes setup once and only once, returning token without secrets', async () => {
    const validCode = service.generateAndSaveSetupCode();
    const setupDto: any = {
      code: validCode,
      owner: {
        email: 'owner@test.uz',
        password: 'password123',
        firstName: 'Owner',
      },
      company: {
        name: 'New Shop',
        currencyCode: 'USD',
        currencySign: '$',
        currencyDecimals: 2,
        themeCode: 'caldera',
      },
      switches: {
        discountsEnabled: true,
        shiftsEnabled: true,
      },
      telegram: {
        botToken: 'bot12345:token',
        chatId: '123456',
      },
    };

    const res = await service.setup(setupDto);
    expect(res.accessToken).toBe('mock-access-token-xyz');
    expect(res.user.email).toBe('owner@test.uz');
    expect(mockSecrets.set).toHaveBeenCalledWith(
      'provider.telegram.bot_token',
      'bot12345:token',
    );

    // Ensure no secrets leaked in user view
    const stringified = JSON.stringify(res);
    expect(stringified).not.toContain('bot12345:token');
    expect(stringified).not.toContain('passwordHash');

    // Attempting setup again returns 409
    await expect(service.setup(setupDto)).rejects.toThrow(ConflictException);
  });
});
