import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import { PricingService } from '../pricing/pricing.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import { SalesPricingService } from './sales-pricing.service.js';

const caller: AuthenticatedUser = {
  id: 'c',
  email: 'c@x',
  permissions: new Set(['sale.create']),
};

function build() {
  const pricing = {
    assertLevel: jest.fn().mockResolvedValue(undefined),
    listPriceForUnit: jest.fn().mockResolvedValue(new Prisma.Decimal(1000)),
    listPriceForProduct: jest.fn().mockResolvedValue(new Prisma.Decimal(30)),
  };
  const settings = {
    get: jest.fn().mockResolvedValue({
      discountsEnabled: false,
      discountPercentAllowed: true,
      discountAmountAllowed: true,
      maxDiscountPercent: new Prisma.Decimal(0),
    }),
  };
  const service = new SalesPricingService(
    pricing as unknown as PricingService,
    settings as unknown as SettingsService,
  );
  return { service, pricing };
}

const device = {
  id: 'dev-1',
  modelId: 'm1',
  specs: { storage: '256GB' },
  targetPrice: new Prisma.Decimal(1000),
  model: { salePrice: null },
};

function dto(over: Partial<CreateSaleDto>): CreateSaleDto {
  return Object.assign(new CreateSaleDto(), { salePrice: 1000 }, over);
}

describe('SalesPricingService', () => {
  it('follows the customer price level when the request omits one', async () => {
    const { service, pricing } = build();
    await service.forUnit(caller, dto({}), device, {
      priceLevelCode: 'WHOLESALE',
      standingDiscountPercent: new Prisma.Decimal(0),
    });
    expect(pricing.listPriceForUnit).toHaveBeenCalledWith(
      'WHOLESALE',
      expect.objectContaining({ deviceId: 'dev-1' }),
    );
  });

  it('defaults to RETAIL with no customer', async () => {
    const { service, pricing } = build();
    await service.forUnit(caller, dto({}), device, null);
    expect(pricing.listPriceForUnit).toHaveBeenCalledWith(
      'RETAIL',
      expect.any(Object),
    );
  });

  it('an explicit request level overrides the customer level', async () => {
    const { service, pricing } = build();
    await service.forUnit(caller, dto({ priceLevelCode: 'PARTNER' }), device, {
      priceLevelCode: 'WHOLESALE',
      standingDiscountPercent: new Prisma.Decimal(0),
    });
    expect(pricing.listPriceForUnit).toHaveBeenCalledWith(
      'PARTNER',
      expect.any(Object),
    );
  });

  it('a quantity line multiplies the per-piece list price by the quantity', async () => {
    const { service } = build(); // per-piece = 30
    const outcome = await service.forQuantity(
      caller,
      dto({ salePrice: 90 }),
      'm1',
      3,
      new Prisma.Decimal(30),
      null,
    );
    expect(outcome.salePrice.toFixed(2)).toBe('90.00');
    expect(outcome.listPriceSnapshot!.toFixed(2)).toBe('90.00');
  });
});
