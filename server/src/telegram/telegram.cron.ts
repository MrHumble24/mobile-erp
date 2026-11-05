import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConsignmentsService } from '../consignments/consignments.service.js';
import { CreditsReadService } from '../credits/credits-read.service.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PartnersService } from '../partners/partners.service.js';
import { ReportsService } from '../reports/reports.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { runWithStoreSelection } from '../stores/lib/store-context.js';
import { StoresService } from '../stores/stores.service.js';
import { shouldSendDigest, todayMarker } from './lib/digest-schedule.js';
import * as messages from './messages.js';
import { TelegramService } from './telegram.service.js';

/** Scheduled Telegram jobs: overdue-consignment nudge and the closing digest. */
@Injectable()
export class TelegramCron {
  private readonly logger = new Logger(TelegramCron.name);

  constructor(
    private readonly telegram: TelegramService,
    private readonly consignments: ConsignmentsService,
    private readonly reports: ReportsService,
    private readonly partners: PartnersService,
    private readonly settings: SettingsService,
    private readonly ledger: LedgerService,
    private readonly credits: CreditsReadService,
    private readonly stores: StoresService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async overdue(): Promise<void> {
    await this.run(async () => {
      const rows = await this.consignments.overdue();
      if (rows.length > 0) {
        await this.telegram.send(
          messages.overdueConsignments(
            rows.map((c) => ({
              partner: c.partnerShopName,
              imei: c.imei ?? c.serialNumber ?? '',
              agreedPrice: Number(c.agreedPrice),
              dueDate: c.dueDate,
            })),
          ),
        );
      }
      const credits = await this.credits.overdue();
      if (credits.length > 0) {
        await this.telegram.send(messages.overdueCredits(credits));
      }
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async closingDigest(): Promise<void> {
    await this.run(async () => {
      const now = new Date();
      const { closingTime, digestSentOn } = await this.settings.get();
      if (!shouldSendDigest(now, closingTime, digestSentOn)) return;

      const activeStores = await this.stores.list(false);
      const partners = await this.partners.list();
      const outstanding = partners.reduce(
        (sum, p) => sum + Number(p.outstanding),
        0,
      );

      const storeBlocks: messages.DigestStoreBlock[] = [];
      let digestDate = '';

      for (const store of activeStores) {
        await runWithStoreSelection(
          { all: false, storeIds: [store.id] },
          async () => {
            const closing = await this.reports.dailyClosing({});
            digestDate = closing.date;
            const dayStart = new Date(`${closing.date}T00:00:00.000Z`);
            const balances = await this.ledger.digestBalances(dayStart);
            storeBlocks.push({
              storeName: store.name,
              unitsSold: closing.unitsSold,
              revenue: closing.revenue,
              netProfit: closing.grossProfit,
              expenses: closing.expenses,
              balances,
            });
          },
        );
      }

      await this.telegram.send(
        messages.dailyDigest({
          date: digestDate || todayMarker(now).toISOString().slice(0, 10),
          outstanding,
          stores: storeBlocks,
        }),
      );
      await this.settings.markDigestSent(todayMarker(now));
    });
  }

  private async run(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (error) {
      this.logger.warn(`Telegram cron failed: ${String(error)}`);
    }
  }
}
