import type { AuthenticatedUser } from '../../common/types/authenticated-user.js';
import type { Prisma } from '../../generated/client/client.js';
import type { PricingOutcome } from '../sales-pricing.service.js';
import type { CreateSaleDto } from '../dto/create-sale.dto.js';
import { warrantyEndsAt } from './warranty.js';
import type {
  CheckoutInput,
  QuantityCheckoutInput,
  SalePayment,
} from '../types/sale.types.js';

/** Assemble the unit-sale checkout input (pure; the service owns the writes). */
export function buildUnitCheckoutInput(args: {
  storeId: string;
  caller: AuthenticatedUser;
  dto: CreateSaleDto;
  device: {
    id: string;
    version: number;
    landedCost: Prisma.Decimal;
    statusCode?: string;
  };
  pricing: PricingOutcome;
  payments: SalePayment[];
  soldAt: Date;
  days: number;
}): CheckoutInput {
  const { dto, device, pricing, caller, soldAt, days } = args;
  return {
    storeId: args.storeId,
    deviceId: device.id,
    fromStatusCode: device.statusCode,
    expectedVersion: dto.expectedVersion ?? device.version,
    salePrice: pricing.salePrice,
    landedCostSnapshot: device.landedCost,
    listPriceSnapshot: pricing.listPriceSnapshot,
    priceLevelCode: pricing.priceLevelCode,
    soldById: caller.id,
    soldAt,
    notes: dto.notes,
    clientMutationId: dto.clientMutationId,
    customerId: dto.customerId,
    inlineCustomer: dto.customer,
    warranty: { days, startsAt: soldAt, endsAt: warrantyEndsAt(soldAt, days) },
    payments: args.payments,
  };
}

/** Assemble the quantity-sale checkout input (pure). No device, no warranty. */
export function buildQuantityCheckoutInput(args: {
  storeId: string;
  caller: AuthenticatedUser;
  dto: CreateSaleDto;
  modelId: string;
  quantity: number;
  pricing: PricingOutcome;
  payments: SalePayment[];
}): QuantityCheckoutInput {
  const { dto, pricing, caller } = args;
  return {
    storeId: args.storeId,
    modelId: args.modelId,
    quantity: args.quantity,
    salePrice: pricing.salePrice,
    listPriceSnapshot: pricing.listPriceSnapshot,
    priceLevelCode: pricing.priceLevelCode,
    soldById: caller.id,
    soldAt: new Date(),
    notes: dto.notes,
    clientMutationId: dto.clientMutationId,
    customerId: dto.customerId,
    inlineCustomer: dto.customer,
    payments: args.payments,
  };
}
