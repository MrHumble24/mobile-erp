import { Prisma } from '../generated/client/client.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import { SalesCreditService } from './sales-credit.service.js';

const D = (n: number) => new Prisma.Decimal(n);
const caller = { id: 'u1', email: 'o@x', permissions: new Set<string>() };
const ctx = { creditId: 'cr-1', storeId: 'store-1', customerId: 'c1' };

function build() {
  const reads = {
    customerPricing: jest.fn().mockResolvedValue(null),
    findDeviceByImei: jest.fn().mockResolvedValue({
      id: 'dev-1',
      statusCode: 'IN_STOCK',
      version: 3,
      landedCost: D(100),
      targetPrice: D(300),
      modelId: 'm1',
      specs: {},
      model: { salePrice: null },
    }),
    defaultWarrantyDays: jest.fn().mockResolvedValue(14),
    modelSalePrice: jest.fn().mockResolvedValue(D(20)),
  };
  const checkout = {
    checkout: jest.fn().mockResolvedValue('sale-1'),
    checkoutQuantity: jest.fn().mockResolvedValue('sale-2'),
  };
  const stock = { assertQuantityModel: jest.fn().mockResolvedValue(undefined) };
  const pricing = {
    forUnit: jest.fn().mockResolvedValue({
      salePrice: D(300),
      listPriceSnapshot: null,
      priceLevelCode: 'RETAIL',
    }),
    forQuantity: jest.fn().mockResolvedValue({
      salePrice: D(40),
      listPriceSnapshot: null,
      priceLevelCode: 'RETAIL',
    }),
  };
  const service = new SalesCreditService(
    reads as never,
    checkout as never,
    stock as never,
    pricing as never,
  );
  return { service, checkout };
}

describe('SalesCreditService.checkoutLine', () => {
  it('checks a unit line out with NO SALE payments and the credit id, inside the tx', async () => {
    const { service, checkout } = build();
    const tx = { marker: true };
    const dto = Object.assign(new CreateSaleDto(), {
      imei: '111111111111111',
      salePrice: 300,
    });
    const result = await service.checkoutLine(caller, dto, ctx, tx as never);

    expect(result).toEqual({ saleId: 'sale-1', salePrice: D(300) });
    const [input, passedTx] = checkout.checkout.mock.calls[0];
    expect(input.payments).toEqual([]); // a credit sale posts no SALE ledger rows
    expect(input.creditId).toBe('cr-1');
    expect(input.deviceId).toBe('dev-1');
    expect(passedTx).toBe(tx); // runs in the credit's transaction
  });

  it('checks a quantity line out with NO SALE payments and the credit id', async () => {
    const { service, checkout } = build();
    const dto = Object.assign(new CreateSaleDto(), {
      modelId: '11111111-1111-1111-1111-111111111111',
      quantity: 2,
      salePrice: 40,
    });
    await service.checkoutLine(caller, dto, ctx, {} as never);
    const [input] = checkout.checkoutQuantity.mock.calls[0];
    expect(input.payments).toEqual([]);
    expect(input.creditId).toBe('cr-1');
    expect(input.quantity).toBe(2);
  });
});
