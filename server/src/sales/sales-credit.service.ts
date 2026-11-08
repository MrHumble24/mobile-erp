import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import { StockService } from '../stock/stock.service.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import { resolveSaleTarget } from './lib/sale-target.js';
import { warrantyEndsAt } from './lib/warranty.js';
import { SalesPricingService } from './sales-pricing.service.js';
import { SalesCheckoutRepository } from './sales-checkout.repository.js';
import { SalesRepository } from './sales.repository.js';
import type { PrismaTx } from '../common/types/prisma-tx.js';

/** Context the cart passes to each credit line. */
export interface CreditLineContext {
  creditId: string;
  storeId: string;
  customerId: string;
}

export interface CheckedOutLine {
  saleId: string;
  salePrice: Prisma.Decimal;
}

/**
 * Checks out one line of a credit cart (ADR 0035), reusing the exact checkout
 * path a normal sale takes (same pricing, stock and status rules) but inside
 * the credit's transaction and posting NO SALE ledger rows — a credit sale's
 * money flows only through CreditPayment. Returns the resolved sale price so
 * the credit service can verify the plan adds up and enforce the limit.
 */
@Injectable()
export class SalesCreditService {
  constructor(
    private readonly reads: SalesRepository,
    private readonly checkout: SalesCheckoutRepository,
    private readonly stock: StockService,
    private readonly pricing: SalesPricingService,
  ) {}

  async checkoutLine(
    caller: AuthenticatedUser,
    dto: CreateSaleDto,
    ctx: CreditLineContext,
    tx: PrismaTx,
    /** The line's share of one disclosed, fixed Murabaha margin (ADR 0068). */
    markupShare: Prisma.Decimal = new Prisma.Decimal(0),
  ): Promise<CheckedOutLine> {
    dto.customerId = ctx.customerId;
    const customer = await this.reads.customerPricing(ctx.customerId);
    const target = resolveSaleTarget(dto);
    if (target.kind === 'quantity') {
      return this.quantityLine(
        caller,
        dto,
        target.modelId,
        target.quantity,
        ctx,
        tx,
        customer,
        markupShare,
      );
    }
    return this.unitLine(
      caller,
      dto,
      target.code,
      ctx,
      tx,
      customer,
      markupShare,
    );
  }

  private async unitLine(
    caller: AuthenticatedUser,
    dto: CreateSaleDto,
    code: string,
    ctx: CreditLineContext,
    tx: PrismaTx,
    customer: {
      priceLevelCode: string;
      standingDiscountPercent: Prisma.Decimal;
    } | null,
    markupShare: Prisma.Decimal,
  ): Promise<CheckedOutLine> {
    const device = await this.reads.findDeviceByImei(code, ctx.storeId);
    if (!device) throw new NotFoundException(`Device ${code} not found`);
    if (device.statusCode !== 'IN_STOCK') {
      throw new ConflictException(
        `Device ${code} is ${device.statusCode}, not available for sale`,
      );
    }
    const pricing = await this.pricing.forUnit(caller, dto, device, customer);
    // Priced as an ordinary CASH sale first; the disclosed margin is then part
    // of the single agreed price on this Sale row (never a second, growing fee).
    const salePrice = pricing.salePrice.plus(markupShare);
    const days = dto.warrantyDays ?? (await this.reads.defaultWarrantyDays());
    const soldAt = new Date();
    const saleId = await this.checkout.checkout(
      {
        storeId: ctx.storeId,
        deviceId: device.id,
        expectedVersion: device.version,
        salePrice,
        landedCostSnapshot: device.landedCost,
        listPriceSnapshot: pricing.listPriceSnapshot,
        priceLevelCode: pricing.priceLevelCode,
        soldById: caller.id,
        soldAt,
        notes: dto.notes,
        customerId: ctx.customerId,
        creditId: ctx.creditId,
        warranty: {
          days,
          startsAt: soldAt,
          endsAt: warrantyEndsAt(soldAt, days),
        },
        payments: [],
      },
      tx,
    );
    return { saleId, salePrice };
  }

  private async quantityLine(
    caller: AuthenticatedUser,
    dto: CreateSaleDto,
    modelId: string,
    quantity: number,
    ctx: CreditLineContext,
    tx: PrismaTx,
    customer: {
      priceLevelCode: string;
      standingDiscountPercent: Prisma.Decimal;
    } | null,
    markupShare: Prisma.Decimal,
  ): Promise<CheckedOutLine> {
    await this.stock.assertQuantityModel(modelId);
    const modelSalePrice = await this.reads.modelSalePrice(modelId);
    const pricing = await this.pricing.forQuantity(
      caller,
      dto,
      modelId,
      quantity,
      modelSalePrice,
      customer,
    );
    const salePrice = pricing.salePrice.plus(markupShare);
    const saleId = await this.checkout.checkoutQuantity(
      {
        storeId: ctx.storeId,
        modelId,
        quantity,
        salePrice,
        listPriceSnapshot: pricing.listPriceSnapshot,
        priceLevelCode: pricing.priceLevelCode,
        soldById: caller.id,
        soldAt: new Date(),
        notes: dto.notes,
        customerId: ctx.customerId,
        creditId: ctx.creditId,
        payments: [],
      },
      tx,
    );
    return { saleId, salePrice };
  }
}
