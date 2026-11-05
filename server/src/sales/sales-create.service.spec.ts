import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { build, caller } from './lib/sales-create.harness.js';

describe('SalesCreateService.create', () => {
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
    await service.create(caller, { imei: '999888777666555', salePrice: 250 });
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
    expect(checkout.checkout).toHaveBeenCalledWith(
      expect.objectContaining({
        payments: [{ accountCode: 'CASH', amount: new Prisma.Decimal(150) }],
      }),
      undefined,
    );
    expect(tradeIn.run).toHaveBeenCalled();
  });

  it('spends points: tenders price − redeem and posts points after the sale', async () => {
    const { service, checkout, tradeIn, bonus } = build({
      customerPricing: jest.fn().mockResolvedValue({
        priceLevelCode: 'RETAIL',
        standingDiscountPercent: new Prisma.Decimal(0),
      }),
    });
    bonus.prepareForSale.mockResolvedValue({
      enabled: true,
      redeem: new Prisma.Decimal(40),
      earnPercent: new Prisma.Decimal(1),
    });
    tradeIn.run.mockImplementation(
      async (
        _p: unknown,
        _c: unknown,
        _s: unknown,
        fn: (tx?: unknown) => Promise<string>,
        after?: (tx: unknown, id: string) => Promise<void>,
      ) => {
        const id = await fn({});
        if (after) await after({}, id);
        return id;
      },
    );
    await service.create(caller, {
      imei: '123456789012345',
      salePrice: 250,
      customerId: 'cust-1',
    });
    expect(checkout.checkout).toHaveBeenCalledWith(
      expect.objectContaining({
        payments: [{ accountCode: 'CASH', amount: new Prisma.Decimal(210) }],
      }),
      {},
    );
    expect(bonus.postForSale).toHaveBeenCalledWith(
      {},
      'sale-1',
      expect.objectContaining({ redeem: new Prisma.Decimal(40) }),
      new Prisma.Decimal(210),
      'cashier-1',
    );
  });
});
