import { BadRequestException, Injectable } from '@nestjs/common';
import { resolveCustomerId } from '../common/lib/resolve-customer.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { CustomerPurchasesService } from '../customer-purchases/customer-purchases.service.js';
import { CustomerPurchasesWriteRepository } from '../customer-purchases/customer-purchases.write.repository.js';
import type { PurchaseUnitInput } from '../customer-purchases/types/customer-purchase.types.js';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSaleDto } from './dto/create-sale.dto.js';
import type { CheckoutOptions } from './sales-pricing.service.js';

const ZERO = new Prisma.Decimal(0);

interface PreparedTradeIn {
  unit: PurchaseUnitInput;
  value: Prisma.Decimal;
}

export interface PreparedTradeIns {
  tradeIns: PreparedTradeIn[];
  total: Prisma.Decimal;
  customerId: string;
}

/**
 * Trade-in at the till (Change 14, ADR 0039). A sale may take phones as part
 * payment: each becomes a customer purchase (same write path as a plain buy —
 * one implementation) created in the sale's own transaction, posting NO ledger
 * row. Its value lowers what the customer tenders; the sale still books its
 * full price. Online only.
 */
@Injectable()
export class SalesTradeInService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly purchases: CustomerPurchasesService,
    private readonly writes: CustomerPurchasesWriteRepository,
  ) {}

  /**
   * Validate the trade-ins (online only, customer required, kind + specs,
   * total ≤ sale price) and resolve the seller onto `dto.customerId`. Returns
   * null when the sale carries no trade-ins.
   */
  async prepare(
    caller: AuthenticatedUser,
    dto: CreateSaleDto,
    options?: CheckoutOptions,
  ): Promise<PreparedTradeIns | null> {
    if (!dto.tradeIns?.length) return null;
    if (options?.fromSync) {
      throw new BadRequestException({
        message: 'Trade-in is not supported for offline sales',
        code: 'TRADE_IN_OFFLINE',
      });
    }
    const customerId = await resolveCustomerId(this.prisma, {
      customerId: dto.customerId,
      inlineCustomer: dto.customer,
    });
    if (!customerId) {
      throw new BadRequestException({
        message: 'A trade-in needs a customer (id or name + phone)',
        code: 'TRADE_IN_NO_CUSTOMER',
      });
    }
    dto.customerId = customerId;
    dto.customer = undefined;

    let total = ZERO;
    const tradeIns: PreparedTradeIn[] = [];
    for (const t of dto.tradeIns) {
      const unit = await this.purchases.prepareUnit(t);
      total = total.plus(t.value);
      tradeIns.push({ unit, value: new Prisma.Decimal(t.value) });
    }
    if (total.greaterThan(new Prisma.Decimal(dto.salePrice))) {
      throw new BadRequestException({
        message: `Trade-in total ${total.toFixed(2)} exceeds the sale price ${dto.salePrice}`,
        code: 'TRADE_IN_EXCEEDS_SALE',
      });
    }
    return { tradeIns, total, customerId };
  }

  /** What the customer still tenders: sale price − Σ trade-in values. */
  dueAmount(salePrice: number, prepared: PreparedTradeIns | null): number {
    if (!prepared) return salePrice;
    return new Prisma.Decimal(salePrice).minus(prepared.total).toNumber();
  }

  /**
   * Run `checkout` and its in-transaction side effects as one commit: the
   * trade-in purchases (when any) and `afterSale` (bonus points, ADR 0043). A
   * transaction is opened when either is present; a bare sale with neither runs
   * checkout on its own.
   */
  async run(
    prepared: PreparedTradeIns | null,
    caller: AuthenticatedUser,
    storeId: string,
    checkout: (tx?: PrismaTx) => Promise<string>,
    afterSale?: (tx: PrismaTx, saleId: string) => Promise<void>,
  ): Promise<string> {
    if (!prepared && !afterSale) return checkout();
    return this.prisma.$transaction(async (tx) => {
      const saleId = await checkout(tx);
      if (prepared) {
        const occurredAt = new Date();
        for (const t of prepared.tradeIns) {
          await this.writes.create(
            {
              storeId,
              customerId: prepared.customerId,
              pricePaid: t.value,
              unit: t.unit,
              createdById: caller.id,
              occurredAt,
              saleId,
            },
            tx,
          );
        }
      }
      if (afterSale) await afterSale(tx, saleId);
      return saleId;
    });
  }
}
