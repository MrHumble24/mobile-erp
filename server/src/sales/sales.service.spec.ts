import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { StockService } from '../stock/stock.service.js';
import { StoresService } from '../stores/stores.service.js';
import { SalesCheckoutRepository } from './sales-checkout.repository.js';
import { SalesPricingService } from './sales-pricing.service.js';
import { SalesReadService } from './sales-read.service.js';
import { SalesRepository } from './sales.repository.js';
import { SalesService } from './sales.service.js';
import { SalesTradeInService } from './sales-trade-in.service.js';

const caller: AuthenticatedUser = {
  id: 'cashier-1',
  email: 'c@x',
  permissions: new Set(['sale.create']),
};

function build(overrides: Partial<Record<string, jest.Mock>> = {}) {
  const { findByClientMutationId, ...readsOverrides } = overrides;
  const reads = {
    findDeviceByImei: jest.fn().mockResolvedValue({
      id: 'dev-1',
      statusCode: 'IN_STOCK',
      version: 3,
      landedCost: 100,
      targetPrice: 300,
    }),
    customerPricing: jest.fn().mockResolvedValue(null),
    modelSalePrice: jest.fn().mockResolvedValue(null),
    defaultWarrantyDays: jest.fn().mockResolvedValue(14),
    findById: jest.fn().mockResolvedValue({ id: 'sale-1' }),
    ...readsOverrides,
  };
  // Read service (list / lookups / view enrichment) — delegated to by SalesService.
  const read = {
    findByClientMutationId:
      findByClientMutationId ?? jest.fn().mockResolvedValue(null),
    withPayments: jest.fn((v: unknown) => Promise.resolve(v)),
    require: jest.fn((id: string) => Promise.resolve({ id })),
    receipt: jest.fn().mockResolvedValue({ saleId: 'sale-1' }),
  };
  const checkout = {
    checkout: jest.fn().mockResolvedValue('sale-1'),
    checkoutQuantity: jest.fn().mockResolvedValue('sale-1'),
  };
  const stores = { currentStoreId: jest.fn().mockResolvedValue('store-1') };
  const ledger = {
    activeAccountCodes: jest.fn().mockResolvedValue(['CASH', 'CARD']),
  };
  const stock = { assertQuantityModel: jest.fn().mockResolvedValue(undefined) };
  const outcome = (dto: { salePrice: number }) => ({
    salePrice: new Prisma.Decimal(dto.salePrice),
    listPriceSnapshot: null,
    priceLevelCode: 'RETAIL',
  });
  const salesPricing = {
    forUnit: jest.fn((_c: unknown, dto: { salePrice: number }) =>
      Promise.resolve(outcome(dto)),
    ),
    forQuantity: jest.fn((_c: unknown, dto: { salePrice: number }) =>
      Promise.resolve(outcome(dto)),
    ),
  };
  const shifts = { assertCanSell: jest.fn(() => Promise.resolve()) };
  // No trade-ins by default: prepare() returns null, run() just executes checkout.
  const tradeIn = {
    prepare: jest.fn().mockResolvedValue(null),
    dueAmount: jest.fn((price: number) => price),
    run: jest.fn(
      (
        _prepared: unknown,
        _caller: unknown,
        _storeId: unknown,
        fn: (tx?: unknown) => Promise<string>,
      ) => fn(),
    ),
  };
  const events = { emit: jest.fn() };
  const service = new SalesService(
    reads as unknown as SalesRepository,
    read as unknown as SalesReadService,
    checkout as unknown as SalesCheckoutRepository,
    stores as unknown as StoresService,
    ledger as unknown as LedgerService,
    stock as unknown as StockService,
    salesPricing as unknown as SalesPricingService,
    shifts as never,
    tradeIn as unknown as SalesTradeInService,
    events as unknown as EventEmitter2,
  );
  return {
    service,
    reads,
    read,
    checkout,
    stores,
    ledger,
    stock,
    salesPricing,
    shifts,
    tradeIn,
    events,
  };
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
    await service.create(caller, {
      imei: '999888777666555',
      salePrice: 250,
    });
    expect(findDeviceByImei).toHaveBeenCalledWith('999888777666555');
    expect(checkout.checkout).toHaveBeenCalledWith(
      expect.objectContaining({ deviceId: 'dev-1' }),
      undefined,
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
    await service.create(caller, { serialNumber: ' sn-9 ', salePrice: 250 });
    expect(findDeviceByImei).toHaveBeenCalledWith('SN-9');
    expect(checkout.checkout).toHaveBeenCalledWith(
      expect.objectContaining({ deviceId: 'dev-9' }),
      undefined,
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
      undefined,
    );
  });

  it('routes a quantity sale (modelId+quantity) to the quantity checkout', async () => {
    const { service, checkout, stock } = build();
    await service.create(caller, {
      modelId: '11111111-1111-1111-1111-111111111111',
      quantity: 3,
      salePrice: 90,
    });
    expect(stock.assertQuantityModel).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
    );
    expect(checkout.checkoutQuantity).toHaveBeenCalledWith(
      expect.objectContaining({
        modelId: '11111111-1111-1111-1111-111111111111',
        quantity: 3,
        salePrice: new Prisma.Decimal(90),
      }),
      undefined,
    );
    expect(checkout.checkout).not.toHaveBeenCalled();
  });

  it('replays a quantity sale by clientMutationId without posting twice', async () => {
    const existing = { id: 'q-prev' };
    const { service, checkout } = build({
      findByClientMutationId: jest.fn().mockResolvedValue(existing),
    });
    const result = await service.create(caller, {
      modelId: '11111111-1111-1111-1111-111111111111',
      quantity: 3,
      salePrice: 90,
      clientMutationId: 'q-1',
    });
    expect(result).toMatchObject({ id: 'q-prev' });
    expect(checkout.checkoutQuantity).not.toHaveBeenCalled();
  });

  it('tenders only sale price − trade-in total, and wraps checkout in one tx', async () => {
    const { service, checkout, tradeIn } = build({
      customerPricing: jest.fn().mockResolvedValue({
        priceLevelCode: 'RETAIL',
        standingDiscountPercent: new Prisma.Decimal(0),
      }),
    });
    tradeIn.prepare.mockResolvedValue({
      tradeIns: [{ unit: {}, value: new Prisma.Decimal(100) }],
      total: new Prisma.Decimal(100),
      customerId: 'cust-1',
    });
    tradeIn.dueAmount.mockReturnValue(150);
    await service.create(caller, {
      imei: '123456789012345',
      salePrice: 250,
      customerId: 'cust-1',
    });
    // payments resolved against the due amount (250 − 100 = 150) → one CASH line.
    expect(checkout.checkout).toHaveBeenCalledWith(
      expect.objectContaining({
        payments: [{ accountCode: 'CASH', amount: new Prisma.Decimal(150) }],
      }),
      undefined,
    );
    expect(tradeIn.run).toHaveBeenCalled();
  });
});

describe('SalesService delegates reads', () => {
  it('receipt delegates to the read service', async () => {
    const { service, read } = build();
    await service.receipt('sale-1');
    expect(read.receipt).toHaveBeenCalledWith('sale-1');
  });
});
