import { BadRequestException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { Prisma } from '../generated/client/client.js';
import { SettingsService } from '../settings/settings.service.js';
import { StoresService } from '../stores/stores.service.js';
import { BonusPost, BonusRepository } from './bonus.repository.js';
import { BonusService } from './bonus.service.js';

/** Typed view of what `repo.post` was called with (the mock is loosely typed). */
const posted = (repo: { post: jest.Mock }): BonusPost[] =>
  repo.post.mock.calls.map((c) => c[0] as BonusPost);

const D = (v: number) => new Prisma.Decimal(v);
const caller: AuthenticatedUser = {
  id: 'owner-1',
  email: 'o@x',
  permissions: new Set(['bonus.adjust']),
};

function build(
  settingsRow: Partial<{
    bonusEnabled: boolean;
    bonusEarnPercent: Prisma.Decimal;
    bonusMaxRedeemPercent: Prisma.Decimal;
  }> = {},
) {
  const repo = {
    balance: jest.fn().mockResolvedValue(D(0)),
    balancesFor: jest.fn().mockResolvedValue(new Map()),
    history: jest.fn().mockResolvedValue([]),
    summaryBySale: jest.fn().mockResolvedValue(new Map()),
    saleRows: jest.fn().mockResolvedValue([]),
    post: jest.fn().mockResolvedValue(undefined),
  };
  const settings = {
    get: jest.fn().mockResolvedValue({
      bonusEnabled: settingsRow.bonusEnabled ?? true,
      bonusEarnPercent: settingsRow.bonusEarnPercent ?? D(1),
      bonusMaxRedeemPercent: settingsRow.bonusMaxRedeemPercent ?? D(50),
    }),
  };
  const stores = { currentStoreId: jest.fn().mockResolvedValue('store-1') };
  const service = new BonusService(
    repo as unknown as BonusRepository,
    settings as unknown as SettingsService,
    stores as unknown as StoresService,
  );
  return { service, repo, settings, stores };
}

const txWith = (customerId: string | null) =>
  ({
    sale: {
      findUnique: jest
        .fn()
        .mockResolvedValue(
          customerId
            ? { customerId, storeId: 'store-1', soldAt: new Date() }
            : { customerId: null, storeId: 'store-1', soldAt: new Date() },
        ),
    },
  }) as unknown as PrismaTx;

describe('BonusService.prepareForSale', () => {
  it('returns no redeem and the earn percent when none requested', async () => {
    const { service } = build();
    const plan = await service.prepareForSale({
      customerId: 'c1',
      salePrice: D(100),
      tradeInTotal: D(0),
    });
    expect(plan.redeem.toFixed(2)).toBe('0.00');
    expect(plan.earnPercent.toFixed(2)).toBe('1.00');
  });

  it('refuses spending points on the offline replay path', async () => {
    const { service } = build();
    await expect(
      service.prepareForSale({
        customerId: 'c1',
        salePrice: D(100),
        tradeInTotal: D(0),
        requestedRedeem: 10,
        fromSync: true,
      }),
    ).rejects.toThrow(/BONUS_REDEEM_OFFLINE|offline/);
  });

  it('refuses spending when bonus is off', async () => {
    const { service } = build({ bonusEnabled: false });
    await expect(
      service.prepareForSale({
        customerId: 'c1',
        salePrice: D(100),
        tradeInTotal: D(0),
        requestedRedeem: 10,
      }),
    ).rejects.toThrow(/BONUS_DISABLED|turned off/);
  });

  it('refuses spending without a customer', async () => {
    const { service } = build();
    await expect(
      service.prepareForSale({
        salePrice: D(100),
        tradeInTotal: D(0),
        requestedRedeem: 10,
      }),
    ).rejects.toThrow(/BONUS_NO_CUSTOMER|needs a customer/);
  });

  it('checks the balance and limits, then returns the redeem', async () => {
    const { service, repo } = build();
    repo.balance.mockResolvedValue(D(10_000));
    const plan = await service.prepareForSale({
      customerId: 'c1',
      salePrice: D(100_000),
      tradeInTotal: D(0),
      requestedRedeem: 10_000,
    });
    expect(plan.redeem.toFixed(2)).toBe('10000.00');
  });
});

describe('BonusService.postForSale', () => {
  it('posts SPEND for the redeem and EARN for the money paid', async () => {
    const { service, repo } = build();
    await service.postForSale(
      txWith('c1'),
      'sale-1',
      { enabled: true, redeem: D(40), earnPercent: D(1) },
      D(210),
      'cashier-1',
    );
    const rows = posted(repo);
    expect(rows.map((r) => r.typeCode)).toEqual(['SPEND', 'EARN']);
    expect(rows[0].amount.toFixed(2)).toBe('-40.00');
    expect(rows[1].amount.toFixed(2)).toBe('2.10');
  });

  it('posts nothing for a sale without a named customer', async () => {
    const { service, repo } = build();
    await service.postForSale(
      txWith(null),
      'sale-1',
      { enabled: true, redeem: D(0), earnPercent: D(1) },
      D(100),
      'cashier-1',
    );
    expect(repo.post).not.toHaveBeenCalled();
  });
});

describe('BonusService.reverseForSale', () => {
  it('takes back earned points and gives back spent points', async () => {
    const { service, repo } = build();
    repo.saleRows.mockResolvedValue([
      { typeCode: 'EARN', amount: D(900) },
      { typeCode: 'SPEND', amount: D(-10_000) },
    ]);
    await service.reverseForSale(txWith('c1'), 'sale-1', 'cashier-1');
    const rows = posted(repo);
    expect(rows.map((r) => r.typeCode)).toEqual(['RETURN', 'RETURN']);
    expect(rows.map((r) => r.amount.toFixed(2))).toEqual([
      '-900.00',
      '10000.00',
    ]); // net +9,100
  });
});

describe('BonusService.adjust', () => {
  it('refuses a zero correction', async () => {
    const { service } = build();
    await expect(
      service.adjust(caller, 'c1', { amount: 0, reason: 'x' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('posts a CORRECTION with the reason', async () => {
    const { service, repo } = build();
    await service.adjust(caller, 'c1', { amount: -50, reason: 'audit fix' });
    expect(repo.post).toHaveBeenCalledWith(
      expect.objectContaining({
        typeCode: 'CORRECTION',
        note: 'audit fix',
      }),
    );
  });
});
