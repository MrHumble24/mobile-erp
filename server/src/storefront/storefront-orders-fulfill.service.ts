import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { Prisma } from '../generated/client/client.js';
import { LedgerService } from '../ledger/ledger.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SalesService } from '../sales/sales.service.js';
import { runWithStoreSelection } from '../stores/lib/store-context.js';
import type { HandOverStorefrontOrderDto } from './dto/hand-over-order.dto.js';
import type { HoldStorefrontOrderDto } from './dto/hold-order.dto.js';
import { toStorefrontOrderDetail } from './lib/order-shaping.js';
import { StorefrontOrdersRepository } from './storefront-orders.repository.js';
import type { StorefrontOrderDetail } from './types/storefront.types.js';

@Injectable()
export class StorefrontOrdersFulfillService {
  constructor(
    private readonly repo: StorefrontOrdersRepository,
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly sales: SalesService,
  ) {}

  async hold(
    storeId: string,
    id: string,
    userId: string,
    dto?: HoldStorefrontOrderDto,
  ): Promise<StorefrontOrderDetail> {
    const order = await this.repo.findOrderById(storeId, id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found in this store`);
    }

    if (order.statusCode === 'DONE' || order.statusCode === 'CANCELLED') {
      throw new BadRequestException({
        code: 'ORDER_TERMINAL',
        message: 'A terminal order cannot hold units',
      });
    }

    if (order.model.kindCode === 'QUANTITY') {
      throw new BadRequestException({
        code: 'QUANTITY_PRODUCT_NOT_HELD',
        message: 'Goods sold by quantity cannot be held',
      });
    }

    if (order.deviceId) {
      throw new ConflictException({
        code: 'ORDER_ALREADY_HOLDS_DEVICE',
        message: 'Order already holds a device unit',
      });
    }

    let unitId: string;
    if (dto?.deviceId) {
      const unit = await this.repo.findUnitById(dto.deviceId, storeId);
      if (!unit || unit.statusCode !== 'IN_STOCK') {
        throw new ConflictException({
          code: 'DEVICE_NOT_AVAILABLE',
          message: 'Named device is not in stock in this store',
        });
      }
      if (unit.modelId !== order.modelId) {
        throw new BadRequestException({
          code: 'MODEL_MISMATCH',
          message: 'Named device model does not match order',
        });
      }
      unitId = unit.id;
    } else {
      const specs =
        order.specs && typeof order.specs === 'object'
          ? (order.specs as Record<string, unknown>)
          : undefined;
      const unit = await this.repo.findOldestInStockUnit(
        order.modelId,
        storeId,
        specs,
      );
      if (!unit) {
        throw new ConflictException({
          code: 'NO_STOCK_AVAILABLE',
          message: 'No in-stock unit available to hold',
        });
      }
      unitId = unit.id;
    }

    await this.repo.holdDevice(order.id, unitId, userId);
    const updated = await this.repo.findOrderById(storeId, id);
    return toStorefrontOrderDetail(updated!);
  }

  async handOver(
    storeId: string,
    id: string,
    caller: AuthenticatedUser,
    dto: HandOverStorefrontOrderDto,
  ): Promise<StorefrontOrderDetail> {
    const order = await this.repo.findOrderById(storeId, id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found in this store`);
    }

    if (order.statusCode !== 'CONTACTED' && order.statusCode !== 'SHIPPED') {
      throw new BadRequestException({
        code: 'ORDER_NOT_READY_FOR_HANDOVER',
        message: 'Order must be CONTACTED or SHIPPED to be handed over',
      });
    }

    if (!order.priceSnapshot) {
      throw new BadRequestException({
        code: 'PRICE_SNAPSHOT_MISSING',
        message:
          'Order has no frozen price snapshot; sell at the till and link the sale',
      });
    }

    if (order.model.kindCode !== 'QUANTITY' && !order.deviceId) {
      throw new BadRequestException({
        code: 'NO_HELD_DEVICE',
        message: 'Order has no held device to hand over',
      });
    }

    const fee = new Prisma.Decimal(order.deliveryFeeSnapshot);
    const paidPayment = order.payments?.find((p) => p.statusCode === 'PAID');
    let finalPayments = dto.payments;
    let finalFeeAccount = dto.deliveryFeeAccountCode;

    if (paidPayment) {
      if (dto.payments && dto.payments.length > 0) {
        const hasOther = dto.payments.some(
          (p) => p.accountCode !== paidPayment.providerCode,
        );
        if (hasOther) {
          throw new BadRequestException({
            code: 'PAYMENT_ACCOUNT_MISMATCH',
            message: `Order was paid online via ${paidPayment.providerCode}; other payments are refused`,
          });
        }
      }
      if (
        fee.greaterThan(0) &&
        dto.deliveryFeeAccountCode &&
        dto.deliveryFeeAccountCode !== paidPayment.providerCode
      ) {
        throw new BadRequestException({
          code: 'DELIVERY_FEE_ACCOUNT_MISMATCH',
          message: `Delivery fee for order paid via ${paidPayment.providerCode} must use ${paidPayment.providerCode} account`,
        });
      }
      finalPayments = [
        {
          accountCode: paidPayment.providerCode,
          amount: Number(order.priceSnapshot),
        },
      ];
      finalFeeAccount = paidPayment.providerCode;
    } else if (fee.greaterThan(0) && !dto.deliveryFeeAccountCode) {
      throw new BadRequestException({
        code: 'DELIVERY_FEE_ACCOUNT_REQUIRED',
        message: 'Account code is required to record delivery fee',
      });
    }

    let saleTarget: {
      imei?: string;
      serialNumber?: string;
      modelId?: string;
      quantity?: number;
    };

    if (order.model.kindCode === 'QUANTITY') {
      saleTarget = { modelId: order.modelId, quantity: 1 };
    } else {
      const unit = await this.repo.findUnitById(order.deviceId!, storeId);
      if (!unit) {
        throw new NotFoundException(`Held device ${order.deviceId} not found`);
      }
      saleTarget = unit.imei
        ? { imei: unit.imei }
        : { serialNumber: unit.serialNumber ?? undefined };
    }

    const sale = await runWithStoreSelection(
      { all: false, storeIds: [storeId] },
      () =>
        this.sales.create(
          caller,
          {
            ...saleTarget,
            salePrice: Number(order.priceSnapshot),
            payments: finalPayments,
            customer: { name: order.customerName, phone: order.customerPhone },
          },
          {
            storefrontOrderId: order.id,
            trustClientPrice: true,
          },
        ),
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      if (fee.greaterThan(0)) {
        await this.ledger.post(
          {
            storeId,
            accountCode: finalFeeAccount!,
            typeCode: 'DELIVERY_FEE',
            amount: fee,
            orderId: order.id,
            createdById: caller.id,
            note: `Delivery fee for storefront order #${order.id}`,
          },
          tx,
        );
      }

      return this.repo.updateOrderStatus(
        storeId,
        id,
        order.statusCode,
        'DONE',
        caller.id,
        sale.id,
        tx,
      );
    });

    return toStorefrontOrderDetail(updated);
  }
}
