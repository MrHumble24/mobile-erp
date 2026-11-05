/* eslint-disable max-lines-per-function -- a test mock factory, like a *.spec.ts build() */
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BonusService } from '../../bonus/bonus.service.js';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.js';
import { Prisma } from '../../generated/client/client.js';
import { LedgerService } from '../../ledger/ledger.service.js';
import { StockService } from '../../stock/stock.service.js';
import { StoresService } from '../../stores/stores.service.js';
import { SalesCheckoutRepository } from '../sales-checkout.repository.js';
import { SalesCreateService } from '../sales-create.service.js';
import { SalesPricingService } from '../sales-pricing.service.js';
import { SalesReadService } from '../sales-read.service.js';
import { SalesRepository } from '../sales.repository.js';
import { SalesTradeInService } from '../sales-trade-in.service.js';

export const caller: AuthenticatedUser = {
  id: 'cashier-1',
  email: 'c@x',
  permissions: new Set(['sale.create']),
};

/** Mocked SalesCreateService with all collaborators stubbed for unit tests. */
export function build(overrides: Partial<Record<string, jest.Mock>> = {}) {
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
  const read = {
    findByClientMutationId:
      findByClientMutationId ?? jest.fn().mockResolvedValue(null),
    require: jest.fn((id: string) => Promise.resolve({ id })),
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
  // Bonus off by default: no redeem, no earn → no afterSale callback.
  const bonus = {
    prepareForSale: jest.fn().mockResolvedValue({
      enabled: false,
      redeem: new Prisma.Decimal(0),
      earnPercent: new Prisma.Decimal(0),
    }),
    postForSale: jest.fn().mockResolvedValue(undefined),
  };
  const events = { emit: jest.fn() };
  const service = new SalesCreateService(
    reads as unknown as SalesRepository,
    read as unknown as SalesReadService,
    checkout as unknown as SalesCheckoutRepository,
    stores as unknown as StoresService,
    ledger as unknown as LedgerService,
    stock as unknown as StockService,
    salesPricing as unknown as SalesPricingService,
    shifts as never,
    tradeIn as unknown as SalesTradeInService,
    bonus as unknown as BonusService,
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
    bonus,
    events,
  };
}
