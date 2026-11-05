import { BadRequestException } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { CustomerPurchasesService } from '../customer-purchases/customer-purchases.service.js';
import { CustomerPurchasesWriteRepository } from '../customer-purchases/customer-purchases.write.repository.js';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import { SalesTradeInService } from './sales-trade-in.service.js';

const caller: AuthenticatedUser = {
  id: 'u-1',
  email: 'c@x',
  permissions: new Set(['sale.create']),
};

function build() {
  const prisma = {
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn('tx')),
    customer: {
      upsert: jest.fn().mockResolvedValue({ id: 'cust-new' }),
      create: jest.fn().mockResolvedValue({ id: 'cust-new' }),
    },
  };
  const purchases = {
    prepareUnit: jest.fn().mockResolvedValue({ modelId: 'm-1', specs: {} }),
  };
  const writes = { create: jest.fn().mockResolvedValue({ purchaseId: 'p-1' }) };
  const service = new SalesTradeInService(
    prisma as unknown as PrismaService,
    purchases as unknown as CustomerPurchasesService,
    writes as unknown as CustomerPurchasesWriteRepository,
  );
  return { service, prisma, purchases, writes };
}

const base = (extra: object): CreateSaleDto => ({
  imei: '123456789012345',
  salePrice: 250,
  ...extra,
});

describe('SalesTradeInService.prepare', () => {
  it('returns null when there are no trade-ins', async () => {
    const { service } = build();
    expect(await service.prepare(caller, base({}))).toBeNull();
  });

  it('refuses trade-ins on an offline replay', async () => {
    const { service } = build();
    const dto = base({
      customerId: 'cust-1',
      tradeIns: [{ modelId: 'm-1', imei: '111111111111111', value: 100 }],
    });
    await expect(
      service.prepare(caller, dto, { fromSync: true }),
    ).rejects.toThrow(BadRequestException);
  });

  it('refuses a trade-in with no customer', async () => {
    const { service } = build();
    const dto = base({
      tradeIns: [{ modelId: 'm-1', imei: '111111111111111', value: 100 }],
    });
    await expect(service.prepare(caller, dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('refuses a trade-in total above the sale price', async () => {
    const { service } = build();
    const dto = base({
      salePrice: 100,
      customerId: 'cust-1',
      tradeIns: [{ modelId: 'm-1', imei: '111111111111111', value: 150 }],
    });
    await expect(service.prepare(caller, dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('prepares the trade-ins and pins the seller onto the dto', async () => {
    const { service } = build();
    const dto = base({
      customerId: 'cust-1',
      tradeIns: [
        { modelId: 'm-1', imei: '111111111111111', value: 100 },
        { modelId: 'm-2', imei: '222222222222222', value: 50 },
      ],
    });
    const prepared = await service.prepare(caller, dto);
    expect(prepared?.total).toEqual(new Prisma.Decimal(150));
    expect(prepared?.customerId).toBe('cust-1');
    expect(dto.customerId).toBe('cust-1');
    expect(dto.customer).toBeUndefined();
  });
});

describe('SalesTradeInService.dueAmount', () => {
  it('is the sale price when there are no trade-ins', () => {
    const { service } = build();
    expect(service.dueAmount(250, null)).toBe(250);
  });

  it('subtracts the trade-in total', () => {
    const { service } = build();
    expect(
      service.dueAmount(250, {
        tradeIns: [],
        total: new Prisma.Decimal(100),
        customerId: 'c',
      }),
    ).toBe(150);
  });
});

describe('SalesTradeInService.run', () => {
  it('runs checkout alone when there are no trade-ins', async () => {
    const { service, prisma, writes } = build();
    const id = await service.run(null, caller, 'store-1', () =>
      Promise.resolve('sale-1'),
    );
    expect(id).toBe('sale-1');
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(writes.create).not.toHaveBeenCalled();
  });

  it('creates each trade-in purchase inside the sale transaction, no ledger', async () => {
    const { service, writes } = build();
    const prepared = {
      tradeIns: [
        { unit: { modelId: 'm-1', specs: {} }, value: new Prisma.Decimal(100) },
      ],
      total: new Prisma.Decimal(100),
      customerId: 'cust-1',
    };
    const id = await service.run(prepared, caller, 'store-1', () =>
      Promise.resolve('sale-1'),
    );
    expect(id).toBe('sale-1');
    expect(writes.create).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 'store-1',
        customerId: 'cust-1',
        pricePaid: new Prisma.Decimal(100),
        saleId: 'sale-1',
      }),
      'tx',
    );
    // A trade-in posts NO ledger row: no account is passed.
    expect(writes.create.mock.calls[0][0].ledgerAccountCode).toBeUndefined();
  });
});
