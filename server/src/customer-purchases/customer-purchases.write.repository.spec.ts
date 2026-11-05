import { ConflictException } from '@nestjs/common';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CustomerPurchasesWriteRepository } from './customer-purchases.write.repository.js';
import type { CustomerPurchaseInput } from './types/customer-purchase.types.js';

const input = (
  over: Partial<CustomerPurchaseInput> = {},
): CustomerPurchaseInput => ({
  storeId: 'store-1',
  customerId: 'cust-1',
  pricePaid: 500,
  unit: { imei: '123456789012345', modelId: 'model-1', specs: {} },
  createdById: 'user-1',
  occurredAt: new Date('2026-02-01'),
  ledgerAccountCode: 'CASH',
  ...over,
});

function mockTx(existing: { statusCode: string; version: number } | null) {
  const device = {
    findFirst: jest
      .fn()
      .mockResolvedValue(existing ? { id: 'dev-1', ...existing } : null),
    create: jest.fn().mockResolvedValue({ id: 'dev-new' }),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  };
  const warranty = { updateMany: jest.fn().mockResolvedValue({ count: 0 }) };
  const deviceStatusHistory = { create: jest.fn().mockResolvedValue({}) };
  const customerPurchase = {
    create: jest.fn().mockResolvedValue({ id: 'pur-1' }),
  };
  const tx = {
    device,
    warranty,
    deviceStatusHistory,
    customerPurchase,
  } as unknown as PrismaTx;
  return { tx, device, warranty, deviceStatusHistory, customerPurchase };
}

function build() {
  const ledger = { post: jest.fn().mockResolvedValue(undefined) };
  const repo = new CustomerPurchasesWriteRepository(
    {} as PrismaService,
    ledger as unknown as LedgerService,
  );
  return { repo, ledger };
}

describe('CustomerPurchasesWriteRepository buy-back (ADR 0044)', () => {
  it('creates a fresh unit when the code is unseen', async () => {
    const { repo } = build();
    const m = mockTx(null);
    const res = await repo.create(input(), m.tx);
    expect(m.device.create).toHaveBeenCalled();
    expect(m.device.updateMany).not.toHaveBeenCalled();
    expect(res.deviceId).toBe('dev-new');
  });

  it('resurrects a SOLD unit instead of 409, ending its old warranty', async () => {
    const { repo } = build();
    const m = mockTx({ statusCode: 'SOLD', version: 4 });
    const res = await repo.create(input(), m.tx);
    expect(m.device.create).not.toHaveBeenCalled();
    expect(m.warranty.updateMany).toHaveBeenCalled();
    expect(m.device.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'dev-1', version: 4, statusCode: 'SOLD' },
        data: expect.objectContaining({
          statusCode: 'IN_STOCK',
          acquisitionCost: 500,
          customsFee: 0,
        }),
      }),
    );
    expect(m.deviceStatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromStatusCode: 'SOLD',
          toStatusCode: 'IN_STOCK',
          reason: 'bought back',
        }),
      }),
    );
    expect(res.deviceId).toBe('dev-1');
  });

  it('rejects a unit that is still in stock (or elsewhere) with 409', async () => {
    const { repo } = build();
    const m = mockTx({ statusCode: 'IN_STOCK', version: 0 });
    await expect(repo.create(input(), m.tx)).rejects.toThrow(ConflictException);
    expect(m.device.updateMany).not.toHaveBeenCalled();
    expect(m.device.create).not.toHaveBeenCalled();
  });

  it('lets a unit go round more than once (sold → bought back, twice)', async () => {
    const { repo } = build();
    const first = mockTx({ statusCode: 'SOLD', version: 4 });
    await repo.create(input(), first.tx);
    expect(first.device.updateMany).toHaveBeenCalledTimes(1);
    // After a re-sale it is SOLD again; a second buy-back resurrects it again.
    const second = mockTx({ statusCode: 'SOLD', version: 6 });
    const res = await repo.create(input(), second.tx);
    expect(second.device.updateMany).toHaveBeenCalledTimes(1);
    expect(res.deviceId).toBe('dev-1');
  });
});
