import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConsignmentsService } from '../consignments/consignments.service.js';
import { PartnersService } from '../partners/partners.service.js';
import { ReportsService } from '../reports/reports.service.js';
import { SettingsService } from '../settings/settings.service.js';
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
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async overdue(): Promise<void> {
    await this.run(async () => {
      const rows = await this.consignments.overdue();
      if (rows.length === 0) return;
      await this.telegram.send(
        messages.overdueConsignments(
          rows.map((c) => ({
            partner: c.partnerShopName,
            imei: c.imei,
            agreedPrice: Number(c.agreedPrice),
            dueDate: c.dueDate,
          })),
        ),
      );
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async closingDigest(): Promise<void> {
    await this.run(async () => {
      const now = new Date();
      const { closingTime, digestSentOn } = await this.settings.get();
      if (!shouldSendDigest(now, closingTime, digestSentOn)) return;

      const [closing, partners] = await Promise.all([
        this.reports.dailyClosing({}),
        this.partners.list(),
      ]);
      const outstanding = partners.reduce(
        (sum, p) => sum + Number(p.outstanding),
        0,
      );
      await this.telegram.send(
        messages.dailyDigest({
          date: closing.date,
          unitsSold: closing.unitsSold,
          revenue: closing.revenue,
          netProfit: closing.grossProfit,
          expenses: closing.expenses,
          outstanding,
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
