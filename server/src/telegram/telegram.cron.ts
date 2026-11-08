import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CompanyService } from '../company/company.service.js';
import { MaintenanceService } from '../common/runtime/maintenance.service.js';
import { ConsignmentsService } from '../consignments/consignments.service.js';
import { CreditsReadService } from '../credits/credits-read.service.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PartnersService } from '../partners/partners.service.js';
import { RepairsReadService } from '../repairs/repairs-read.service.js';
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
    private readonly company: CompanyService,
    private readonly maintenance: MaintenanceService,
    private readonly repairsRead: RepairsReadService,
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
      const timeZone = await this.company.getTimeZone();
      const { storeBlocks, dueStoreIds, digestDate } =
        await this.collectDigestBlocks(now, timeZone);

      if (storeBlocks.length === 0) return;

      const partners = await this.partners.list();
      const outstanding = partners.reduce(
        (sum, p) => sum + Number(p.outstanding),
        0,
      );

      await this.telegram.send(
        messages.dailyDigest({
          date:
            digestDate || todayMarker(now, timeZone).toISOString().slice(0, 10),
          outstanding,
          stores: storeBlocks,
        }),
      );

      for (const storeId of dueStoreIds) {
        await runWithStoreSelection({ all: false, storeIds: [storeId] }, () =>
          this.settings.markDigestSent(todayMarker(now, timeZone)),
        );
      }
    });
  }

  private async collectDigestBlocks(
    now: Date,
    timeZone: string,
  ): Promise<{
    storeBlocks: messages.DigestStoreBlock[];
    dueStoreIds: string[];
    digestDate: string;
  }> {
    const activeStores = await this.stores.list(false);
    const storeBlocks: messages.DigestStoreBlock[] = [];
    let digestDate = '';
    const dueStoreIds: string[] = [];

    for (const store of activeStores) {
      await runWithStoreSelection(
        { all: false, storeIds: [store.id] },
        async () => {
          const { closingTime, digestSentOn } = await this.settings.get();
          if (!shouldSendDigest(now, closingTime, digestSentOn, timeZone))
            return;

          const closing = await this.reports.dailyClosing({});
          digestDate = closing.date;
          const dayStart = new Date(`${closing.date}T00:00:00.000Z`);
          const dayEnd = new Date(`${closing.date}T23:59:59.999Z`);
          const balances = await this.ledger.digestBalances(dayStart);
          const repair = await this.repairsRead.repairDailySummary(
            [store.id],
            dayStart,
            dayEnd,
          );
          storeBlocks.push({
            storeName: store.name,
            unitsSold: closing.unitsSold,
            revenue: closing.revenue,
            netProfit: closing.grossProfit,
            expenses: closing.expenses,
            repairIncome: repair.income,
            repairProfit: repair.profit,
            balances,
          });
          dueStoreIds.push(store.id);
        },
      );
    }

    return { storeBlocks, dueStoreIds, digestDate };
  }

  private async run(fn: () => Promise<void>): Promise<void> {
    // Scheduled jobs stand down while a restore holds maintenance.
    if (this.maintenance.isActive()) return;
    try {
      await fn();
    } catch (error) {
      this.logger.warn(`Telegram cron failed: ${String(error)}`);
    }
  }
}
