import { SessionGateService } from './session-gate.service.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

/** In-memory stand-in for the one session_gate row. */
function fakePrisma(initial?: bigint, failRead = false) {
  const store = { validAfterSec: initial };
  return {
    store,
    sessionGate: {
      findUnique: jest.fn(() =>
        failRead
          ? Promise.reject(new Error('db down'))
          : Promise.resolve(
              store.validAfterSec === undefined
                ? null
                : { id: 'default', validAfterSec: store.validAfterSec },
            ),
      ),
      upsert: jest.fn((args: { create: { validAfterSec: bigint } }) => {
        store.validAfterSec = args.create.validAfterSec;
        return Promise.resolve({
          id: 'default',
          validAfterSec: store.validAfterSec,
        });
      }),
    },
  } as unknown as PrismaService & { store: { validAfterSec?: bigint } };
}

describe('SessionGateService', () => {
  it('accepts any token when no cutoff is set', async () => {
    const gate = new SessionGateService(fakePrisma());
    await gate.onModuleInit();
    expect(await gate.isValid(1000)).toBe(true);
    expect(await gate.isValid(undefined)).toBe(true);
  });

  it('rejects tokens issued before the cutoff after ending sessions', async () => {
    const prisma = fakePrisma();
    const gate = new SessionGateService(prisma);
    await gate.onModuleInit();
    const before = Math.floor(Date.now() / 1000) - 10;
    await gate.endAllSessions();
    expect(await gate.isValid(before)).toBe(false);
    expect(await gate.isValid(Math.floor(Date.now() / 1000) + 5)).toBe(true);
  });

  it('loads an existing cutoff from the database at boot (survives a restart)', async () => {
    const future = BigInt(Math.floor(Date.now() / 1000) + 100);
    const gate = new SessionGateService(fakePrisma(future));
    await gate.onModuleInit();
    expect(await gate.isValid(Math.floor(Date.now() / 1000))).toBe(false);
  });

  it('fails closed when the cutoff cannot be read', async () => {
    const gate = new SessionGateService(fakePrisma(undefined, true));
    await gate.onModuleInit();
    expect(await gate.isValid(Math.floor(Date.now() / 1000) + 999)).toBe(false);
  });
});
