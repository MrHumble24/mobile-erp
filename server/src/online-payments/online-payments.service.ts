import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { OnlinePaymentPort } from './online-payment.port.js';
import { OnlinePaymentsConfigService } from './online-payments-config.service.js';
import { OnlinePaymentsRepository } from './online-payments.repository.js';
import type {
  CancelPaymentParams,
  FindPaymentParams,
  ListPaymentsParams,
  MarkPaidParams,
  PaymentOrderInfo,
  PaymentRecord,
  ProviderConfigView,
  StartPaymentParams,
} from './types/online-payment.types.js';

@Injectable()
export class OnlinePaymentsService implements OnlinePaymentPort {
  constructor(
    private readonly repo: OnlinePaymentsRepository,
    private readonly prisma: PrismaService,
    private readonly configService: OnlinePaymentsConfigService,
  ) {}

  listConfigs(): Promise<ProviderConfigView[]> {
    return this.configService.listConfigs();
  }

  getConfig(code: string): Promise<ProviderConfigView> {
    return this.configService.getConfig(code);
  }

  saveConfig(
    code: string,
    dto: {
      isEnabled?: boolean;
      isTestMode?: boolean;
      allowedIps?: string[] | null;
      settings?: Record<string, unknown>;
    },
  ): Promise<ProviderConfigView> {
    return this.configService.saveConfig(code, dto);
  }

  setSecret(code: string, secret: string): Promise<void> {
    return this.configService.setSecret(code, secret);
  }

  checkProvider(code: string): Promise<{ ok: boolean; message: string }> {
    return this.configService.checkProvider(code);
  }

  async refundPayment(id: string, reason: string): Promise<PaymentRecord> {
    const payment = await this.repo.findPaymentById(id);
    if (!payment) throw new NotFoundException(`Payment ${id} not found`);
    if (payment.statusCode !== 'REFUND_DUE') {
      throw new BadRequestException({
        code: 'PAYMENT_NOT_REFUND_DUE',
        message: `Payment is in ${payment.statusCode} status; only REFUND_DUE payments can be marked REFUNDED`,
      });
    }

    return this.repo.updatePayment(id, {
      status: { connect: { code: 'REFUNDED' } },
      refundedAt: new Date(),
      reason: reason || payment.reason,
    });
  }

  // --- OnlinePaymentPort Implementation ---

  async findOrderForPayment(orderId: string): Promise<PaymentOrderInfo | null> {
    return this.repo.findOrderForPayment(orderId);
  }

  async findPayment(params: FindPaymentParams): Promise<PaymentRecord | null> {
    if (params.paymentId) {
      return this.repo.findPaymentById(params.paymentId);
    }
    if (params.providerCode && params.providerTransId) {
      return this.repo.findPaymentByProviderTransId(
        params.providerCode,
        params.providerTransId,
      );
    }
    if (params.orderId) {
      return this.repo.findActivePaymentForOrder(params.orderId);
    }
    return null;
  }

  async listPaymentsForPeriod(
    params: ListPaymentsParams,
  ): Promise<PaymentRecord[]> {
    return this.repo.listPaymentsForPeriod(
      params.providerCode,
      params.from,
      params.to,
    );
  }

  async startPayment(params: StartPaymentParams): Promise<PaymentRecord> {
    return this.prisma.$transaction(async (tx) => {
      await this.repo.lockOrder(params.orderId, tx);
      const order = await this.repo.findOrderForPayment(params.orderId, tx);
      if (!order)
        throw new NotFoundException(`Order ${params.orderId} not found`);

      if (order.paymentMethodCode !== 'ONLINE') {
        throw new BadRequestException('Order is not an ONLINE payment order');
      }
      if (order.statusCode === 'CANCELLED' || order.statusCode === 'DONE') {
        throw new BadRequestException('Order is in terminal status');
      }

      if (params.providerTransId) {
        const existing = await this.repo.findPaymentByProviderTransId(
          params.providerCode,
          params.providerTransId,
          tx,
        );
        if (existing) return existing;
      }

      const active = await this.repo.findActivePaymentForOrder(
        params.orderId,
        tx,
      );
      if (active) {
        if (active.statusCode === 'PAID')
          throw new ConflictException('Order is already paid');
        if (
          active.statusCode === 'CREATED' &&
          active.providerTransId !== params.providerTransId
        ) {
          throw new ConflictException(
            'Order already has an active pending payment',
          );
        }
      }

      const expected = new Prisma.Decimal(order.totalAmount);
      const actual = new Prisma.Decimal(params.amount);
      if (!actual.equals(expected))
        throw new BadRequestException(
          'Payment amount does not match order total',
        );

      if (!order.deviceId) {
        const rawOrder = await tx.storefrontOrder.findUnique({
          where: { id: params.orderId },
          include: { model: true },
        });
        if (rawOrder && rawOrder.model.kindCode !== 'QUANTITY') {
          await this.repo.holdDeviceForOrder(
            params.orderId,
            rawOrder.modelId,
            rawOrder.storeId,
            (rawOrder.specs as Record<string, unknown>) ?? {},
            tx,
          );
        }
      }

      return this.repo.createPayment(
        {
          order: { connect: { id: params.orderId } },
          provider: { connect: { code: params.providerCode } },
          status: { connect: { code: 'CREATED' } },
          amount: actual,
          providerTransId: params.providerTransId,
          providerPrepareId: params.providerPrepareId,
          rawPayload: params.rawPayload ? params.rawPayload : Prisma.DbNull,
        },
        tx,
      );
    });
  }

  async markPaid(params: MarkPaidParams): Promise<PaymentRecord> {
    return this.prisma.$transaction(async (tx) => {
      let payment: PaymentRecord | null = null;
      if (params.paymentId) {
        payment = await this.repo.findPaymentById(params.paymentId, tx);
      } else if (params.providerTransId) {
        payment = await this.repo.findPaymentByProviderTransId(
          params.providerCode,
          params.providerTransId,
          tx,
        );
      }
      if (!payment) throw new NotFoundException('Payment not found');

      await this.repo.lockOrder(payment.orderId, tx);
      if (payment.statusCode === 'PAID') return payment;
      if (payment.statusCode !== 'CREATED') {
        throw new ConflictException(
          `Payment cannot be marked PAID from ${payment.statusCode}`,
        );
      }

      return this.repo.updatePayment(
        payment.id,
        {
          status: { connect: { code: 'PAID' } },
          paidAt: new Date(),
          rawPayload: params.rawPayload ? params.rawPayload : undefined,
        },
        tx,
      );
    });
  }

  async cancelPayment(params: CancelPaymentParams): Promise<PaymentRecord> {
    return this.prisma.$transaction(async (tx) => {
      let payment: PaymentRecord | null = null;
      if (params.paymentId) {
        payment = await this.repo.findPaymentById(params.paymentId, tx);
      } else if (params.providerTransId) {
        payment = await this.repo.findPaymentByProviderTransId(
          params.providerCode,
          params.providerTransId,
          tx,
        );
      }
      if (!payment) throw new NotFoundException('Payment not found');

      await this.repo.lockOrder(payment.orderId, tx);
      const order = await tx.storefrontOrder.findUnique({
        where: { id: payment.orderId },
      });
      if (!order) throw new NotFoundException('Order not found');

      if (
        payment.statusCode === 'CANCELLED' ||
        payment.statusCode === 'REFUNDED'
      )
        return payment;
      if (order.saleId)
        throw new BadRequestException(
          'Order is already handed over and sold; payment cannot be cancelled',
        );

      if (order.deviceId)
        await this.repo.releaseDeviceForOrder(order.id, order.deviceId, tx);
      if (order.statusCode !== 'CANCELLED') {
        await this.repo.updateOrderStatus(
          order.id,
          order.statusCode,
          'CANCELLED',
          params.reason ?? 'Cancelled by payment gateway',
          tx,
        );
      }

      const nextStatus =
        payment.statusCode === 'PAID' ? 'REFUNDED' : 'CANCELLED';
      const timestampUpdate =
        nextStatus === 'REFUNDED'
          ? { refundedAt: new Date() }
          : { cancelledAt: new Date() };

      return this.repo.updatePayment(
        payment.id,
        {
          status: { connect: { code: nextStatus } },
          reason: params.reason,
          rawPayload: params.rawPayload ? params.rawPayload : undefined,
          ...timestampUpdate,
        },
        tx,
      );
    });
  }
}
