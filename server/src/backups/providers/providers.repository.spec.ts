import { ProvidersRepository } from './providers.repository.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

interface Row {
  providerCode: string;
  usedAt: Date | null;
  expiresAt: Date;
}

function repoWith(row: (Row & Record<string, unknown>) | null) {
  // Emulate the conditional updateMany: it claims the row only if it is still
  // unused, unexpired and this provider's.
  const updateMany = jest.fn((args: { where: { providerCode: string } }) => {
    const ok =
      row !== null &&
      row.usedAt === null &&
      row.providerCode === args.where.providerCode &&
      row.expiresAt.getTime() > Date.now();
    return Promise.resolve({ count: ok ? 1 : 0 });
  });
  const prisma = {
    backupOauthState: {
      findUnique: jest.fn().mockResolvedValue(row),
      updateMany,
    },
  } as unknown as PrismaService;
  return { repo: new ProvidersRepository(prisma), updateMany };
}

const future = () => new Date(Date.now() + 60_000);
const past = () => new Date(Date.now() - 60_000);

describe('ProvidersRepository.consumeOauthState', () => {
  it('rejects an unknown state', async () => {
    const { repo } = repoWith(null);
    expect(await repo.consumeOauthState('s', 'GOOGLE_DRIVE')).toBeNull();
  });

  it('rejects an already-used state', async () => {
    const { repo } = repoWith({
      state: 's',
      providerCode: 'GOOGLE_DRIVE',
      usedAt: new Date(),
      expiresAt: future(),
    });
    expect(await repo.consumeOauthState('s', 'GOOGLE_DRIVE')).toBeNull();
  });

  it('rejects an expired state', async () => {
    const { repo } = repoWith({
      state: 's',
      providerCode: 'GOOGLE_DRIVE',
      usedAt: null,
      expiresAt: past(),
    });
    expect(await repo.consumeOauthState('s', 'GOOGLE_DRIVE')).toBeNull();
  });

  it("rejects another provider's state", async () => {
    const { repo } = repoWith({
      state: 's',
      providerCode: 'ONEDRIVE',
      usedAt: null,
      expiresAt: future(),
    });
    expect(await repo.consumeOauthState('s', 'GOOGLE_DRIVE')).toBeNull();
  });

  it('accepts a valid state and marks it used atomically', async () => {
    const { repo, updateMany } = repoWith({
      state: 's',
      providerCode: 'GOOGLE_DRIVE',
      userId: 'u1',
      usedAt: null,
      expiresAt: future(),
    });
    const row = (await repo.consumeOauthState('s', 'GOOGLE_DRIVE')) as {
      userId: string;
    } | null;
    expect(row?.userId).toBe('u1');
    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ state: 's', usedAt: null }),
      }),
    );
  });
});
