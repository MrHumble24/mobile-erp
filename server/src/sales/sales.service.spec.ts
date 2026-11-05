import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { StoresService } from '../stores/stores.service.js';
import { SalesCheckoutRepository } from './sales-checkout.repository.js';
import { SalesRepository } from './sales.repository.js';
import { SalesService } from './sales.service.js';

const caller: AuthenticatedUser = {
  id: 'cashier-1',
  email: 'c@x',
  permissions: new Set(['sale.create']),
};

function build(readsOverrides: Partial<Record<string, jest.Mock>> = {}) {
  const reads = {
    findByClientMutationId: jest.fn().mockResolvedValue(null),
    findDeviceByImei: jest.fn().mockResolvedValue({
      id: 'dev-1',
      statusCode: 'IN_STOCK',
      version: 3,
      landedCost: 100,
      targetPrice: 300,
    }),
    customerExists: jest.fn().mockResolvedValue(true),
    defaultWarrantyDays: jest.fn().mockResolvedValue(14),
    findById: jest.fn().mockResolvedValue({
      id: 'sale-1',
      device: {
        imei: '123456789012345',
        model: { brand: 'Apple', name: '15' },
      },
    }),
    findSaleForReturn: jest.fn().mockResolvedValue({
      id: 'sale-1',
      deviceId: 'dev-1',
      storeId: 'store-1',
      salePrice: new Prisma.Decimal(250),
    }),
    findDeviceState: jest.fn().mockResolvedValue({ version: 5 }),
    ...readsOverrides,
  };
  const checkout = {
    checkout: jest.fn().mockResolvedValue('sale-1'),
    processReturn: jest.fn().mockResolvedValue(undefined),
  };
  const stores = { currentStoreId: jest.fn().mockResolvedValue('store-1') };
  const ledger = {
    activeAccountCodes: jest.fn().mockResolvedValue(['CASH', 'CARD']),
    salePayments: jest.fn().mockResolvedValue(new Map()),
  };
  const events = { emit: jest.fn() };
  const service = new SalesService(
    reads as unknown as SalesRepository,
    checkout as unknown as SalesCheckoutRepository,
    stores as unknown as StoresService,
    ledger as unknown as LedgerService,
    events as unknown as EventEmitter2,
  );
  return { service, reads, checkout, stores, ledger, events };
}

describe('SalesService.create', () => {
  const dto = { imei: '123456789012345', salePrice: 250 } as never;

  it('is idempotent: returns the existing sale and skips checkout', async () => {
    const existing = { id: 'sale-prev' };
    const { service, checkout } = build({
      findByClientMutationId: jest.fn().mockResolvedValue(existing),
    });
    const result = await service.create(caller, {
      ...(dto as object),
      clientMutationId: 'm-1',
    } as never);
    expect(result).toMatchObject({ id: 'sale-prev' });
    expect(checkout.checkout).not.toHaveBeenCalled();
  });

  it('rejects a device that is not IN_STOCK', async () => {
    const { service, checkout } = build({
      findDeviceByImei: jest.fn().mockResolvedValue({
        id: 'dev-1',
        statusCode: 'DEFECTIVE',
        version: 1,
        landedCost: 100,
      }),
    });
    await expect(service.create(caller, dto)).rejects.toThrow(
      ConflictException,
    );
    expect(checkout.checkout).not.toHaveBeenCalled();
  });

  it('rejects a missing device', async () => {
    const { service } = build({
      findDeviceByImei: jest.fn().mockResolvedValue(null),
    });
    await expect(service.create(caller, dto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('sells a device scanned by its second IMEI', async () => {
    const findDeviceByImei = jest.fn().mockResolvedValue({
      id: 'dev-1',
      statusCode: 'IN_STOCK',
      version: 3,
      landedCost: 100,
      targetPrice: 300,
    });
    const { service, checkout } = build({ findDeviceByImei });
    // The scanned value is the unit's imei2; the repository resolves either column.
    await service.create(caller, {
      imei: '999888777666555',
      salePrice: 250,
    });
    expect(findDeviceByImei).toHaveBeenCalledWith('999888777666555');
    expect(checkout.checkout).toHaveBeenCalledWith(
      expect.objectContaining({ deviceId: 'dev-1' }),
    );
  });

  it('sells a serial unit by its (normalised) serial number', async () => {
    const findDeviceByImei = jest.fn().mockResolvedValue({
      id: 'dev-9',
      statusCode: 'IN_STOCK',
      version: 0,
      landedCost: 100,
      targetPrice: 300,
    });
    const { service, checkout } = build({ findDeviceByImei });
    await service.create(caller, {
      serialNumber: ' sn-9 ',
      salePrice: 250,
    });
    expect(findDeviceByImei).toHaveBeenCalledWith('SN-9');
    expect(checkout.checkout).toHaveBeenCalledWith(
      expect.objectContaining({ deviceId: 'dev-9' }),
    );
  });

  it('rejects a body with neither imei nor serialNumber', async () => {
    const { service } = build();
    await expect(service.create(caller, { salePrice: 250 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('snapshots landed cost and the current cashier on checkout', async () => {
    const { service, checkout } = build();
    await service.create(caller, dto);
    expect(checkout.checkout).toHaveBeenCalledWith(
      expect.objectContaining({
        deviceId: 'dev-1',
        expectedVersion: 3,
        landedCostSnapshot: 100,
        soldById: 'cashier-1',
        warranty: expect.objectContaining({ days: 14 }),
      }),
    );
  });
});

describe('SalesService.receipt', () => {
  it('attaches the sale payments from its SALE ledger rows', async () => {
    const svc = build({
      receipt: jest.fn().mockResolvedValue({ saleId: 'sale-1', payments: [] }),
    });
    svc.ledger.salePayments.mockResolvedValue(
      new Map([
        ['sale-1', [{ accountCode: 'CARD', amount: new Prisma.Decimal(500) }]],
      ]),
    );
    const receipt = await svc.service.receipt('sale-1');
    expect(receipt.payments).toEqual([
      { accountCode: 'CARD', amount: new Prisma.Decimal(500) },
    ]);
  });

  it('returns [] payments when the sale has no ledger rows', async () => {
    const svc = build({
      receipt: jest.fn().mockResolvedValue({ saleId: 'sale-1', payments: [] }),
    });
    const receipt = await svc.service.receipt('sale-1');
    expect(receipt.payments).toEqual([]);
  });
});

describe('SalesService.processReturn refund cap', () => {
  const ret = (refundAmount: number) =>
    ({ refundAmount, deviceToStatusCode: 'IN_STOCK' }) as never;

  it('allows a refund equal to the sale net (ledger sale)', async () => {
    const svc = build();
    svc.ledger.salePayments.mockResolvedValue(
      new Map([
        ['sale-1', [{ accountCode: 'CASH', amount: new Prisma.Decimal(250) }]],
      ]),
    );
    await svc.service.processReturn(caller, 'sale-1', ret(250));
    expect(svc.checkout.processReturn).toHaveBeenCalled();
  });

  it('rejects one unit above the sale net (ledger sale)', async () => {
    const svc = build();
    svc.ledger.salePayments.mockResolvedValue(
      new Map([
        ['sale-1', [{ accountCode: 'CASH', amount: new Prisma.Decimal(250) }]],
      ]),
    );
    await expect(
      svc.service.processReturn(caller, 'sale-1', ret(251)),
    ).rejects.toThrow(BadRequestException);
    expect(svc.checkout.processReturn).not.toHaveBeenCalled();
  });

  it('caps a pre-ledger sale at its salePrice: equal passes, above fails', async () => {
    const ok = build(); // salePayments -> empty Map (pre-ledger), salePrice 250
    await ok.service.processReturn(caller, 'sale-1', ret(250));
    expect(ok.checkout.processReturn).toHaveBeenCalled();

    const bad = build();
    await expect(
      bad.service.processReturn(caller, 'sale-1', ret(250.01)),
    ).rejects.toThrow(BadRequestException);
    expect(bad.checkout.processReturn).not.toHaveBeenCalled();
  });
});
