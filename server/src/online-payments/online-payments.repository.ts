import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { OnlinePaymentsConfigRepository } from './online-payments-config.repository.js';
import type {
  PaymentOrderInfo,
  PaymentRecord,
} from './types/online-payment.types.js';

type OnlinePaymentRow = Prisma.OnlinePaymentGetPayload<Record<string, never>>;

function toPaymentRecord(p: OnlinePaymentRow): PaymentRecord {
  return {
    id: p.id,
    orderId: p.orderId,
    providerCode: p.providerCode,
    providerTransId: p.providerTransId,
    providerPrepareId: p.providerPrepareId,
    amount: new Prisma.Decimal(p.amount).toFixed(2),
    statusCode: p.statusCode,
    rawPayload: p.rawPayload,
    reason: p.reason,
    paidAt: p.paidAt,
    cancelledAt: p.cancelledAt,
    refundedAt: p.refundedAt,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

@Injectable()
export class OnlinePaymentsRepository extends OnlinePaymentsConfigRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async lockOrder(
    orderId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.$queryRaw`SELECT id FROM "storefront_orders" WHERE id = ${orderId} FOR UPDATE`;
  }

  async findOrderForPayment(
    orderId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<PaymentOrderInfo | null> {
    const client = tx ?? this.prisma;
    const order = await client.storefrontOrder.findUnique({
      where: { id: orderId },
      include: { model: true },
    });
    if (!order) return null;

    let hasStock = true;
    if (order.model.kindCode !== 'QUANTITY' && !order.deviceId) {
      const conditions: Prisma.DeviceWhereInput[] = [
        {
          modelId: order.modelId,
          storeId: order.storeId,
          statusCode: 'IN_STOCK',
        },
      ];
      const specs = order.specs as Record<string, unknown> | null;
      if (specs?.storage) {
        conditions.push({
          specs: { path: ['storage'], equals: specs.storage },
        });
      }
      if (specs?.color) {
        conditions.push({ specs: { path: ['color'], equals: specs.color } });
      }
      const stock = await client.device.findFirst({
        where: conditions.length === 1 ? conditions[0] : { AND: conditions },
      });
      hasStock = stock !== null;
    }

    const price = order.priceSnapshot
      ? new Prisma.Decimal(order.priceSnapshot)
      : new Prisma.Decimal(0);
    const fee = new Prisma.Decimal(order.deliveryFeeSnapshot);
    const total = price.add(fee);

    return {
      id: order.id,
      orderNumber: order.id.slice(0, 8),
      storeId: order.storeId,
      modelId: order.modelId,
      specs: (order.specs as Record<string, unknown>) ?? {},
      paymentMethodCode: order.paymentMethodCode,
      statusCode: order.statusCode,
      priceSnapshot: order.priceSnapshot
        ? order.priceSnapshot.toFixed(2)
        : null,
      deliveryFeeSnapshot: fee.toFixed(2),
      totalAmount: total.toFixed(2),
      deviceId: order.deviceId,
      saleId: order.saleId,
      hasStock,
    };
  }

  async holdDeviceForOrder(
    orderId: string,
    modelId: string,
    storeId: string,
    specs: Record<string, unknown>,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const conditions: Prisma.DeviceWhereInput[] = [
      { modelId, storeId, statusCode: 'IN_STOCK' },
    ];
    if (specs?.storage)
      conditions.push({ specs: { path: ['storage'], equals: specs.storage } });
    if (specs?.color)
      conditions.push({ specs: { path: ['color'], equals: specs.color } });

    const unit = await tx.device.findFirst({
      where: conditions.length === 1 ? conditions[0] : { AND: conditions },
      orderBy: { createdAt: 'asc' },
    });
    if (!unit) {
      throw new ConflictException({
        code: 'NO_STOCK_AVAILABLE',
        message: 'No in-stock unit available to hold',
      });
    }

    const updated = await tx.device.updateMany({
      where: { id: unit.id, statusCode: 'IN_STOCK' },
      data: { statusCode: 'RESERVED', version: { increment: 1 } },
    });
    if (updated.count === 0) {
      throw new ConflictException({
        code: 'DEVICE_NOT_AVAILABLE',
        message: 'Device is no longer in stock',
      });
    }

    const actor = await tx.user.findFirst({ select: { id: true } });
    if (actor) {
      await tx.deviceStatusHistory.create({
        data: {
          deviceId: unit.id,
          fromStatusCode: 'IN_STOCK',
          toStatusCode: 'RESERVED',
          changedById: actor.id,
          reason: `Held for online order #${orderId}`,
        },
      });
    }

    await tx.storefrontOrder.update({
      where: { id: orderId },
      data: { deviceId: unit.id },
    });

    return unit.id;
  }

  async releaseDeviceForOrder(
    orderId: string,
    deviceId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.device.updateMany({
      where: { id: deviceId, statusCode: 'RESERVED' },
      data: { statusCode: 'IN_STOCK', version: { increment: 1 } },
    });
    const actor = await tx.user.findFirst({ select: { id: true } });
    if (actor) {
      await tx.deviceStatusHistory.create({
        data: {
          deviceId,
          fromStatusCode: 'RESERVED',
          toStatusCode: 'IN_STOCK',
          changedById: actor.id,
          reason: `Released from online payment cancel for order #${orderId}`,
        },
      });
    }
    await tx.storefrontOrder.update({
      where: { id: orderId },
      data: { deviceId: null },
    });
  }

  async updateOrderStatus(
    orderId: string,
    fromStatusCode: string,
    toStatusCode: string,
    note: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.storefrontOrderStatusHistory.create({
      data: {
        orderId,
        fromStatusCode,
        toStatusCode,
        note,
      },
    });
    await tx.storefrontOrder.update({
      where: { id: orderId },
      data: { statusCode: toStatusCode },
    });
  }

  async findPaymentById(
    id: string,
    tx?: Prisma.TransactionClient,
  ): Promise<PaymentRecord | null> {
    const client = tx ?? this.prisma;
    const p = await client.onlinePayment.findUnique({ where: { id } });
    return p ? toPaymentRecord(p) : null;
  }

  async findPaymentByProviderTransId(
    providerCode: string,
    providerTransId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<PaymentRecord | null> {
    const client = tx ?? this.prisma;
    const p = await client.onlinePayment.findUnique({
      where: {
        providerCode_providerTransId: { providerCode, providerTransId },
      },
    });
    return p ? toPaymentRecord(p) : null;
  }

  async findActivePaymentForOrder(
    orderId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<PaymentRecord | null> {
    const client = tx ?? this.prisma;
    const p = await client.onlinePayment.findFirst({
      where: {
        orderId,
        statusCode: { in: ['CREATED', 'PAID'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    return p ? toPaymentRecord(p) : null;
  }

  async createPayment(
    data: Prisma.OnlinePaymentCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<PaymentRecord> {
    const client = tx ?? this.prisma;
    const p = await client.onlinePayment.create({ data });
    return toPaymentRecord(p);
  }

  async updatePayment(
    id: string,
    data: Prisma.OnlinePaymentUpdateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<PaymentRecord> {
    const client = tx ?? this.prisma;
    const p = await client.onlinePayment.update({ where: { id }, data });
    return toPaymentRecord(p);
  }

  async listPaymentsForPeriod(
    providerCode: string,
    from: Date,
    to: Date,
  ): Promise<PaymentRecord[]> {
    const list = await this.prisma.onlinePayment.findMany({
      where: {
        providerCode,
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: 'asc' },
    });
    return list.map(toPaymentRecord);
  }

  async findExpiredPayments(olderThan: Date) {
    return this.prisma.onlinePayment.findMany({
      where: {
        statusCode: 'CREATED',
        createdAt: { lt: olderThan },
      },
      include: { order: true },
    });
  }
}
