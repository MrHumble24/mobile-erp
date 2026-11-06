import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { publicOrigin } from '../common/lib/origins.js';
import { Prisma } from '../generated/client/client.js';
import { OnlinePaymentsRepository } from '../online-payments/online-payments.repository.js';
import { ProviderRegistry } from '../online-payments/providers/provider.registry.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StorefrontPayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsRepo: OnlinePaymentsRepository,
    private readonly registry: ProviderRegistry,
  ) {}

  async payOrder(
    orderId: string,
    providerCode?: string,
  ): Promise<{ checkoutUrl: string }> {
    const order = await this.prisma.storefrontOrder.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });
    if (!order) {
      throw new NotFoundException({
        code: 'ORDER_NOT_FOUND',
        message: `Order ${orderId} not found`,
      });
    }

    if (order.paymentMethodCode !== 'ONLINE') {
      throw new BadRequestException({
        code: 'NOT_AN_ONLINE_ORDER',
        message: 'Order was not placed with ONLINE payment method',
      });
    }

    if (order.statusCode === 'CANCELLED' || order.statusCode === 'DONE') {
      throw new BadRequestException({
        code: 'ORDER_TERMINAL',
        message: 'Order is in a terminal status',
      });
    }

    const isPaid = order.payments.some((p) => p.statusCode === 'PAID');
    if (isPaid) {
      throw new BadRequestException({
        code: 'ORDER_ALREADY_PAID',
        message: 'Order has already been paid',
      });
    }

    const configs = await this.paymentsRepo.listConfigs();
    const activeConfigs = configs.filter((c) => c.isEnabled);
    if (activeConfigs.length === 0) {
      throw new BadRequestException({
        code: 'ONLINE_PAYMENT_NOT_AVAILABLE',
        message: 'No online payment provider is enabled',
      });
    }

    let targetConfig = activeConfigs[0];
    if (providerCode) {
      const found = activeConfigs.find(
        (c) => c.providerCode === providerCode.toUpperCase(),
      );
      if (!found) {
        throw new BadRequestException({
          code: 'PROVIDER_NOT_AVAILABLE',
          message: `Provider ${providerCode} is not available`,
        });
      }
      targetConfig = found;
    }

    const price = order.priceSnapshot
      ? new Prisma.Decimal(order.priceSnapshot)
      : new Prisma.Decimal(0);
    const fee = new Prisma.Decimal(order.deliveryFeeSnapshot);
    const total = price.add(fee);

    const adapter = this.registry.get(targetConfig.providerCode);
    const returnUrl = `${publicOrigin()}/orders/${order.id}`;
    const checkoutUrl = adapter.checkoutUrl(
      {
        orderId: order.id,
        amount: total.toFixed(2),
        returnUrl,
      },
      {
        ...(targetConfig.settings as Record<string, unknown>),
        isTestMode: targetConfig.isTestMode,
      },
    );

    return { checkoutUrl };
  }
}
