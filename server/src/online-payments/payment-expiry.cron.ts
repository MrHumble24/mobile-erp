import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { OnlinePaymentsRepository } from './online-payments.repository.js';
import { OnlinePaymentsService } from './online-payments.service.js';

const EXPIRATION_WINDOW_MS = 12 * 60 * 60 * 1000; // 12 hours

@Injectable()
export class PaymentExpiryCron {
  private readonly logger = new Logger(PaymentExpiryCron.name);

  constructor(
    private readonly repo: OnlinePaymentsRepository,
    private readonly payments: OnlinePaymentsService,
    private readonly prisma: PrismaService,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleExpiration(): Promise<void> {
    const cutoff = new Date(Date.now() - EXPIRATION_WINDOW_MS);
    try {
      const expiredPayments = await this.repo.findExpiredPayments(cutoff);
      for (const p of expiredPayments) {
        try {
          await this.payments.cancelPayment({
            paymentId: p.id,
            providerCode: p.providerCode,
            reason: 'Payment expired after 12 hours',
          });
          this.logger.log(
            `Expired CREATED payment ${p.id} for order #${p.orderId}`,
          );
        } catch (err) {
          this.logger.warn(`Failed to expire payment ${p.id}: ${String(err)}`);
        }
      }

      // Also clean up any unpaid online orders without a payment created that sat NEW for 12 hours
      const abandonedOrders = await this.prisma.storefrontOrder.findMany({
        where: {
          paymentMethodCode: 'ONLINE',
          statusCode: 'NEW',
          createdAt: { lt: cutoff },
          payments: {
            none: { statusCode: { in: ['PAID', 'CREATED'] } },
          },
        },
      });

      for (const order of abandonedOrders) {
        try {
          await this.prisma.$transaction(async (tx) => {
            if (order.deviceId) {
              await this.repo.releaseDeviceForOrder(
                order.id,
                order.deviceId,
                tx,
              );
            }
            await this.repo.updateOrderStatus(
              order.id,
              order.statusCode,
              'CANCELLED',
              'Online order expired: unpaid after 12 hours',
              tx,
            );
          });
          this.logger.log(`Expired unpaid online order #${order.id}`);
        } catch (err) {
          this.logger.warn(
            `Failed to expire order ${order.id}: ${String(err)}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(`Error in payment expiry cron: ${String(err)}`);
    }
  }
}
