import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { SettingsService } from '../settings/settings.service.js';
import { StockAlertRulesService } from '../stock-alert-rules/stock-alert-rules.service.js';
import { isBelowMargin, marginPercent } from './lib/margin.js';
import * as messages from './messages.js';
import { TelegramService } from './telegram.service.js';
import {
  ConsignmentCreatedEvent,
  PartnerPaymentReceivedEvent,
  RepairCreatedEvent,
  RepairGivenBackEvent,
  RepairReadyEvent,
  SaleCreatedEvent,
  ShipmentDevicesRegisteredEvent,
  TelegramEvents,
} from './events/telegram-events.js';

/** Turns domain events into Telegram alerts. Listeners never throw into emit(). */
@Injectable()
export class TelegramListener {
  private readonly logger = new Logger(TelegramListener.name);
  /** Suppresses re-sending the same low-stock list on every subsequent sale. */
  private lastLowStockFingerprint: string | null = null;

  constructor(
    private readonly telegram: TelegramService,
    private readonly settings: SettingsService,
    private readonly stockAlerts: StockAlertRulesService,
  ) {}

  @OnEvent(TelegramEvents.shipmentDevicesRegistered)
  onShipment(e: ShipmentDevicesRegisteredEvent): Promise<void> {
    return this.run(() => this.telegram.send(messages.shipmentRegistered(e)));
  }

  @OnEvent(TelegramEvents.saleCreated)
  onSale(e: SaleCreatedEvent): Promise<void> {
    return this.run(async () => {
      const { minMarginPercent } = await this.settings.get();
      if (
        isBelowMargin(
          e.salePrice,
          e.landedCostSnapshot,
          e.targetPrice,
          Number(minMarginPercent),
        )
      ) {
        await this.telegram.send(
          messages.belowMarginSale({
            imei: e.imei,
            model: e.model,
            salePrice: e.salePrice,
            targetPrice: e.targetPrice,
            marginPercent: marginPercent(e.salePrice, e.landedCostSnapshot),
          }),
        );
      }
      await this.checkLowStock();
    });
  }

  @OnEvent(TelegramEvents.consignmentCreated)
  onConsignment(e: ConsignmentCreatedEvent): Promise<void> {
    return this.run(async () => {
      await this.telegram.send(messages.consignmentCreated(e));
      await this.checkLowStock();
    });
  }

  @OnEvent(TelegramEvents.partnerPaymentReceived)
  onPayment(e: PartnerPaymentReceivedEvent): Promise<void> {
    return this.run(() => this.telegram.send(messages.paymentReceived(e)));
  }

  @OnEvent(TelegramEvents.repairCreated)
  onRepairCreated(e: RepairCreatedEvent): Promise<void> {
    return this.run(() => this.telegram.send(messages.repairCreated(e)));
  }

  @OnEvent(TelegramEvents.repairReady)
  onRepairReady(e: RepairReadyEvent): Promise<void> {
    return this.run(() => this.telegram.send(messages.repairReady(e)));
  }

  @OnEvent(TelegramEvents.repairGivenBack)
  onRepairGivenBack(e: RepairGivenBackEvent): Promise<void> {
    return this.run(() => this.telegram.send(messages.repairGivenBack(e)));
  }

  private async checkLowStock(): Promise<void> {
    const rows = await this.stockAlerts.lowStock();
    if (rows.length === 0) return;
    const fingerprint = rows.map((r) => `${r.id}:${r.currentCount}`).join('|');
    if (fingerprint === this.lastLowStockFingerprint) return;
    this.lastLowStockFingerprint = fingerprint;
    await this.telegram.send(messages.lowStock(rows));
  }

  private async run(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (error) {
      this.logger.warn(`Telegram listener failed: ${String(error)}`);
    }
  }
}
