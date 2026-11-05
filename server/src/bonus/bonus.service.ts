import { BadRequestException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import type { PrismaTx } from '../common/types/prisma-tx.js';
import { Prisma } from '../generated/client/client.js';
import { SettingsService } from '../settings/settings.service.js';
import { StoresService } from '../stores/stores.service.js';
import { BonusRepository } from './bonus.repository.js';
import { AdjustBonusDto } from './dto/adjust-bonus.dto.js';
import { assertRedeemWithinLimits, earnedPoints } from './lib/bonus-math.js';
import type { BonusConfig, BonusPlan, BonusView } from './types/bonus.types.js';

type Decimal = Prisma.Decimal;
const D = (v: number | string | Decimal): Decimal => new Prisma.Decimal(v);
const ZERO = D(0);

/**
 * Loyalty bonus points (ADR 0043), behind a switch. Owns the per-customer
 * append-only points ledger: EARN/SPEND on a sale, RETURN reversal, and a manual
 * CORRECTION by the owner. A balance is always the signed SUM of a customer's
 * rows. Sales inject this service to plan + post points inside their own
 * transaction; it never reaches another module's repository.
 */
@Injectable()
export class BonusService {
  constructor(
    private readonly repo: BonusRepository,
    private readonly settings: SettingsService,
    private readonly stores: StoresService,
  ) {}

  async config(): Promise<BonusConfig> {
    const s = await this.settings.get();
    return {
      enabled: s.bonusEnabled,
      earnPercent: D(s.bonusEarnPercent),
      maxRedeemPercent: D(s.bonusMaxRedeemPercent),
    };
  }

  /** Customer balance + history + the store's live config, for the till / UI. */
  async view(customerId: string): Promise<BonusView> {
    const storeId = await this.stores.currentStoreId();
    const cfg = await this.config();
    const [balance, history] = await Promise.all([
      this.repo.balance(storeId, customerId),
      this.repo.history(storeId, customerId),
    ]);
    return {
      customerId,
      enabled: cfg.enabled,
      earnPercent: cfg.earnPercent.toFixed(2),
      maxRedeemPercent: cfg.maxRedeemPercent.toFixed(2),
      balance: balance.toFixed(2),
      history,
    };
  }

  /** Balances for a set of customers (POS search); empty map when disabled. */
  async balancesFor(customerIds: string[]): Promise<Map<string, string>> {
    const storeId = await this.stores.currentStoreId();
    const raw = await this.repo.balancesFor(storeId, customerIds);
    const map = new Map<string, string>();
    for (const id of customerIds) map.set(id, (raw.get(id) ?? ZERO).toFixed(2));
    return map;
  }

  /** Points earned/spent per sale (2-dp strings) for the sale and receipt views. */
  async summaryBySale(
    saleIds: string[],
  ): Promise<Map<string, { earned: string; spent: string }>> {
    const raw = await this.repo.summaryBySale(saleIds);
    const map = new Map<string, { earned: string; spent: string }>();
    for (const [id, s] of raw) {
      map.set(id, { earned: s.earned.toFixed(2), spent: s.spent.toFixed(2) });
    }
    return map;
  }

  /** Owner-only manual correction (reason required). Append-only like the rest. */
  async adjust(
    caller: AuthenticatedUser,
    customerId: string,
    dto: AdjustBonusDto,
  ): Promise<BonusView> {
    const amount = D(dto.amount);
    if (amount.isZero()) {
      throw new BadRequestException('A correction amount cannot be zero');
    }
    const storeId = await this.stores.currentStoreId();
    await this.repo.post({
      storeId,
      customerId,
      typeCode: 'CORRECTION',
      amount,
      note: dto.reason,
      createdById: caller.id,
    });
    return this.view(customerId);
  }

  /**
   * Validate a sale's optional points redemption and return the plan the sale
   * posts inside its own transaction (ADR 0043). Spending points is online
   * only — refused on the sync replay path with a stable code.
   */
  async prepareForSale(input: {
    customerId?: string;
    salePrice: Decimal;
    tradeInTotal: Decimal;
    requestedRedeem?: number;
    fromSync?: boolean;
  }): Promise<BonusPlan> {
    const cfg = await this.config();
    const redeem = D(input.requestedRedeem ?? 0);
    if (redeem.lessThanOrEqualTo(0)) {
      return {
        enabled: cfg.enabled,
        redeem: ZERO,
        earnPercent: cfg.earnPercent,
      };
    }
    if (input.fromSync) {
      throw new BadRequestException({
        message: 'Spending bonus points is not supported for offline sales',
        code: 'BONUS_REDEEM_OFFLINE',
      });
    }
    if (!cfg.enabled) {
      throw new BadRequestException({
        message: 'Bonus points are turned off',
        code: 'BONUS_DISABLED',
      });
    }
    if (!input.customerId) {
      throw new BadRequestException({
        message: 'Spending bonus points needs a customer',
        code: 'BONUS_NO_CUSTOMER',
      });
    }
    const storeId = await this.stores.currentStoreId();
    const balance = await this.repo.balance(storeId, input.customerId);
    assertRedeemWithinLimits(redeem, {
      balance,
      salePrice: input.salePrice,
      maxRedeemPercent: cfg.maxRedeemPercent,
      tradeInTotal: input.tradeInTotal,
    });
    return { enabled: cfg.enabled, redeem, earnPercent: cfg.earnPercent };
  }

  /**
   * Post the SPEND (points funded the sale) and EARN (earn percent × money paid)
   * rows for a committed sale, inside its transaction. No named customer → no
   * points. `paid` is the cash/card tender (not the points- or trade-in-funded
   * part). A credit sale never calls this, so a credit sale earns nothing.
   */
  async postForSale(
    tx: PrismaTx,
    saleId: string,
    plan: BonusPlan,
    paid: Decimal,
    createdById: string,
  ): Promise<void> {
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      select: { customerId: true, storeId: true, soldAt: true },
    });
    if (!sale?.customerId) return;
    if (plan.redeem.greaterThan(0)) {
      await this.repo.post(
        {
          storeId: sale.storeId,
          customerId: sale.customerId,
          typeCode: 'SPEND',
          amount: plan.redeem.negated(),
          saleId,
          occurredAt: sale.soldAt,
          createdById,
        },
        tx,
      );
    }
    if (plan.enabled) {
      const earn = earnedPoints(paid, plan.earnPercent);
      if (earn.greaterThan(0)) {
        await this.repo.post(
          {
            storeId: sale.storeId,
            customerId: sale.customerId,
            typeCode: 'EARN',
            amount: earn,
            saleId,
            occurredAt: sale.soldAt,
            createdById,
          },
          tx,
        );
      }
    }
  }

  /**
   * A return takes back the points the sale earned and gives back the points it
   * spent (ADR 0043), posting one RETURN row per original EARN/SPEND row with
   * the opposite sign. The balance may go below zero if the earned points were
   * already spent. Runs inside the return's transaction.
   */
  async reverseForSale(
    tx: PrismaTx,
    saleId: string,
    createdById: string,
  ): Promise<void> {
    const sale = await tx.sale.findUnique({
      where: { id: saleId },
      select: { customerId: true, storeId: true },
    });
    if (!sale?.customerId) return;
    const rows = await this.repo.saleRows(tx, saleId);
    for (const row of rows) {
      await this.repo.post(
        {
          storeId: sale.storeId,
          customerId: sale.customerId,
          typeCode: 'RETURN',
          amount: row.amount.negated(),
          saleId,
          createdById,
        },
        tx,
      );
    }
  }
}
