import { BadRequestException } from '@nestjs/common';
import { timingSafeEqualString } from '../lib/timing-safe.js';
import type { OnlinePaymentPort } from '../online-payment.port.js';
import type {
  CallbackRequest,
  CallbackResponse,
} from '../types/online-payment.types.js';
import type {
  CheckoutUrlParams,
  OnlinePaymentProvider,
} from './online-payment.provider.js';
import {
  PAYME_ERRORS,
  type PaymeParams,
  getPaymeState,
  mapStatementTransaction,
  rpcError,
  rpcSuccess,
} from './payme.errors.js';

export class PaymeProvider implements OnlinePaymentProvider {
  readonly code = 'PAYME';

  async validate(config: unknown, secret: unknown): Promise<void> {
    await Promise.resolve();
    const cfg = (config ?? {}) as { merchantId?: string };
    if (!cfg.merchantId || typeof cfg.merchantId !== 'string') {
      throw new BadRequestException('Payme merchantId is required');
    }
    if (!secret || typeof secret !== 'string') {
      throw new BadRequestException('Payme merchant key secret is required');
    }
  }

  checkoutUrl(params: CheckoutUrlParams, config: unknown): string {
    const cfg = (config ?? {}) as { merchantId?: string; isTestMode?: boolean };
    const tiyin = Math.round(Number(params.amount) * 100);
    const data = `m=${cfg.merchantId ?? ''};ac.order_id=${params.orderId};a=${tiyin};c=${params.returnUrl}`;
    const host = cfg.isTestMode
      ? 'https://test.paycom.uz'
      : 'https://checkout.paycom.uz';
    return `${host}/${Buffer.from(data).toString('base64')}`;
  }

  async handleCallback(
    req: CallbackRequest,
    _config: unknown,
    secret: unknown,
    port: OnlinePaymentPort,
  ): Promise<CallbackResponse> {
    const auth = req.headers['authorization'];
    const id = (req.body as { id?: unknown })?.id ?? null;
    if (!auth || typeof auth !== 'string' || !auth.startsWith('Basic ')) {
      return rpcError(id, PAYME_ERRORS.AUTH_FAILED);
    }

    const credentials = Buffer.from(auth.slice(6), 'base64').toString('utf8');
    const [user, key] = credentials.split(':');
    const secretStr = typeof secret === 'string' ? secret : '';
    if (
      user !== 'Paycom' ||
      !key ||
      !secretStr ||
      !timingSafeEqualString(key, secretStr)
    ) {
      return rpcError(id, PAYME_ERRORS.AUTH_FAILED);
    }

    const body = (req.body ?? {}) as {
      method?: string;
      params?: PaymeParams;
      id?: unknown;
    };
    const { method, params } = body;
    if (!method || !params) return rpcError(id, PAYME_ERRORS.INVALID_JSON_RPC);

    switch (method) {
      case 'CheckPerformTransaction':
        return this.checkPerform(id, params, port);
      case 'CreateTransaction':
        return this.createTransaction(id, params, port);
      case 'PerformTransaction':
        return this.performTransaction(id, params, port);
      case 'CheckTransaction':
        return this.checkTransaction(id, params, port);
      case 'CancelTransaction':
        return this.cancelTransaction(id, params, port);
      case 'GetStatement':
        return this.getStatement(id, params, port);
      default:
        return rpcError(id, PAYME_ERRORS.METHOD_NOT_FOUND);
    }
  }

  private async checkPerform(
    id: unknown,
    params: PaymeParams,
    port: OnlinePaymentPort,
  ): Promise<CallbackResponse> {
    const orderId = params.account?.order_id;
    if (!orderId) return rpcError(id, PAYME_ERRORS.ORDER_NOT_FOUND);
    const order = await port.findOrderForPayment(orderId);
    if (!order) return rpcError(id, PAYME_ERRORS.ORDER_NOT_FOUND);

    const tiyin = Math.round(Number(order.totalAmount) * 100);
    if (Number(params.amount) !== tiyin) {
      return rpcError(id, PAYME_ERRORS.WRONG_AMOUNT);
    }
    if (
      order.paymentMethodCode !== 'ONLINE' ||
      order.statusCode === 'CANCELLED' ||
      order.statusCode === 'DONE' ||
      order.saleId !== null ||
      !order.hasStock
    ) {
      return rpcError(id, PAYME_ERRORS.CANNOT_PERFORM);
    }
    return rpcSuccess(id, { allow: true });
  }

  private async createTransaction(
    id: unknown,
    params: PaymeParams,
    port: OnlinePaymentPort,
  ): Promise<CallbackResponse> {
    const transId = params.id ? String(params.id) : undefined;
    const orderId = params.account?.order_id;
    if (!transId || !orderId) return rpcError(id, PAYME_ERRORS.ORDER_NOT_FOUND);

    const existing = await port.findPayment({
      providerCode: 'PAYME',
      providerTransId: transId,
    });
    if (existing) {
      return rpcSuccess(id, {
        create_time: existing.createdAt.getTime(),
        transaction: existing.id,
        state: getPaymeState(existing),
        receivers: null,
      });
    }

    const order = await port.findOrderForPayment(orderId);
    if (!order) return rpcError(id, PAYME_ERRORS.ORDER_NOT_FOUND);

    const tiyin = Math.round(Number(order.totalAmount) * 100);
    if (Number(params.amount) !== tiyin) {
      return rpcError(id, PAYME_ERRORS.WRONG_AMOUNT);
    }
    if (
      order.paymentMethodCode !== 'ONLINE' ||
      order.statusCode === 'CANCELLED' ||
      order.statusCode === 'DONE' ||
      !order.hasStock
    ) {
      return rpcError(id, PAYME_ERRORS.CANNOT_PERFORM);
    }

    try {
      const p = await port.startPayment({
        orderId,
        providerCode: 'PAYME',
        amount: order.totalAmount,
        providerTransId: transId,
        rawPayload: params,
      });
      return rpcSuccess(id, {
        create_time: p.createdAt.getTime(),
        transaction: p.id,
        state: 1,
        receivers: null,
      });
    } catch {
      return rpcError(id, PAYME_ERRORS.CANNOT_PERFORM);
    }
  }

  private async performTransaction(
    id: unknown,
    params: PaymeParams,
    port: OnlinePaymentPort,
  ): Promise<CallbackResponse> {
    const transId = params.id ? String(params.id) : undefined;
    if (!transId) return rpcError(id, PAYME_ERRORS.TRANSACTION_NOT_FOUND);

    const payment = await port.findPayment({
      providerCode: 'PAYME',
      providerTransId: transId,
    });
    if (!payment) return rpcError(id, PAYME_ERRORS.TRANSACTION_NOT_FOUND);

    if (payment.statusCode === 'PAID') {
      return rpcSuccess(id, {
        transaction: payment.id,
        perform_time: payment.paidAt!.getTime(),
        state: 2,
      });
    }
    if (payment.statusCode !== 'CREATED') {
      return rpcError(id, PAYME_ERRORS.CANNOT_CANCEL);
    }

    const paid = await port.markPaid({
      paymentId: payment.id,
      providerCode: 'PAYME',
      providerTransId: transId,
      rawPayload: params,
    });
    return rpcSuccess(id, {
      transaction: paid.id,
      perform_time: paid.paidAt!.getTime(),
      state: 2,
    });
  }

  private async checkTransaction(
    id: unknown,
    params: PaymeParams,
    port: OnlinePaymentPort,
  ): Promise<CallbackResponse> {
    const transId = params.id ? String(params.id) : undefined;
    if (!transId) return rpcError(id, PAYME_ERRORS.TRANSACTION_NOT_FOUND);

    const payment = await port.findPayment({
      providerCode: 'PAYME',
      providerTransId: transId,
    });
    if (!payment) return rpcError(id, PAYME_ERRORS.TRANSACTION_NOT_FOUND);

    return rpcSuccess(id, {
      create_time: payment.createdAt.getTime(),
      perform_time: payment.paidAt?.getTime() ?? 0,
      cancel_time: (payment.cancelledAt ?? payment.refundedAt)?.getTime() ?? 0,
      transaction: payment.id,
      state: getPaymeState(payment),
      reason: payment.reason ? Number(payment.reason) || null : null,
    });
  }

  private async cancelTransaction(
    id: unknown,
    params: PaymeParams,
    port: OnlinePaymentPort,
  ): Promise<CallbackResponse> {
    const transId = params.id ? String(params.id) : undefined;
    if (!transId) return rpcError(id, PAYME_ERRORS.TRANSACTION_NOT_FOUND);

    const payment = await port.findPayment({
      providerCode: 'PAYME',
      providerTransId: transId,
    });
    if (!payment) return rpcError(id, PAYME_ERRORS.TRANSACTION_NOT_FOUND);

    if (
      payment.statusCode === 'CANCELLED' ||
      payment.statusCode === 'REFUNDED'
    ) {
      return rpcSuccess(id, {
        transaction: payment.id,
        cancel_time: (payment.cancelledAt ?? payment.refundedAt)!.getTime(),
        state: getPaymeState(payment),
      });
    }

    try {
      const cancelled = await port.cancelPayment({
        paymentId: payment.id,
        providerCode: 'PAYME',
        providerTransId: transId,
        reason: String(params.reason ?? ''),
        rawPayload: params,
      });
      return rpcSuccess(id, {
        transaction: cancelled.id,
        cancel_time: (cancelled.cancelledAt ?? cancelled.refundedAt)!.getTime(),
        state: getPaymeState(cancelled),
      });
    } catch {
      return rpcError(id, PAYME_ERRORS.CANNOT_CANCEL);
    }
  }

  private async getStatement(
    id: unknown,
    params: PaymeParams,
    port: OnlinePaymentPort,
  ): Promise<CallbackResponse> {
    const list = await port.listPaymentsForPeriod({
      providerCode: 'PAYME',
      from: new Date(Number(params.from)),
      to: new Date(Number(params.to)),
    });
    return rpcSuccess(id, { transactions: list.map(mapStatementTransaction) });
  }
}
