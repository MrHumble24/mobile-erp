import { ProvidersRepository } from './providers.repository.js';
import type { PrismaService } from '../../prisma/prisma.service.js';

function repoWith(row: Record<string, unknown> | null) {
  const update = jest.fn().mockResolvedValue({});
  const prisma = {
    backupOauthState: {
      findUnique: jest.fn().mockResolvedValue(row),
      update,
    },
  } as unknown as PrismaService;
  return { repo: new ProvidersRepository(prisma), update };
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

  it('accepts a valid state and marks it used', async () => {
    const { repo, update } = repoWith({
      state: 's',
      providerCode: 'GOOGLE_DRIVE',
      userId: 'u1',
      usedAt: null,
      expiresAt: future(),
    });
    const row = await repo.consumeOauthState('s', 'GOOGLE_DRIVE');
    expect(row?.userId).toBe('u1');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { state: 's' } }),
    );
  });
});
