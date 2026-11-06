import { BadRequestException } from '@nestjs/common';
import { timingSafeEqualString } from '../lib/timing-safe.js';
import type { OnlinePaymentPort } from '../online-payment.port.js';
import type {
  CallbackRequest,
  CallbackResponse,
} from '../types/online-payment.types.js';
import {
  CLICK_ERRORS,
  clickResponse,
  computeClickSign,
} from './click.errors.js';
import type {
  CheckoutUrlParams,
  OnlinePaymentProvider,
} from './online-payment.provider.js';

interface ClickCallbackBody {
  click_trans_id?: string | number;
  service_id?: string | number;
  merchant_trans_id?: string;
  merchant_prepare_id?: string | number;
  amount?: string | number;
  action?: number | string;
  error?: number | string;
  error_note?: string;
  sign_time?: string;
  sign_string?: string;
  [key: string]: unknown;
}

export class ClickProvider implements OnlinePaymentProvider {
  readonly code = 'CLICK';

  async validate(config: unknown, secret: unknown): Promise<void> {
    await Promise.resolve();
    const cfg = (config ?? {}) as { serviceId?: string; merchantId?: string };
    if (!cfg.serviceId || typeof cfg.serviceId !== 'string') {
      throw new BadRequestException('Click serviceId is required');
    }
    if (!cfg.merchantId || typeof cfg.merchantId !== 'string') {
      throw new BadRequestException('Click merchantId is required');
    }
    if (!secret || typeof secret !== 'string') {
      throw new BadRequestException('Click secret key is required');
    }
  }

  checkoutUrl(params: CheckoutUrlParams, config: unknown): string {
    const cfg = (config ?? {}) as { serviceId?: string; merchantId?: string };
    const serviceId = cfg.serviceId ?? '';
    const merchantId = cfg.merchantId ?? '';
    const returnUrl = encodeURIComponent(params.returnUrl);
    return `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${params.amount}&transaction_param=${params.orderId}&return_url=${returnUrl}`;
  }

  async handleCallback(
    req: CallbackRequest,
    _config: unknown,
    secret: unknown,
    port: OnlinePaymentPort,
  ): Promise<CallbackResponse> {
    const body = (req.body ?? {}) as ClickCallbackBody;
    const clickTransId = String(body.click_trans_id ?? '');
    const serviceId = String(body.service_id ?? '');
    const merchantTransId = String(body.merchant_trans_id ?? '');
    const merchantPrepareId = body.merchant_prepare_id
      ? String(body.merchant_prepare_id)
      : undefined;
    const amount = String(body.amount ?? '');
    const action = Number(body.action);
    const error = Number(body.error ?? 0);
    const signTime = String(body.sign_time ?? '');
    const signString = String(body.sign_string ?? '').toLowerCase();

    const secretStr = typeof secret === 'string' ? secret : '';
    if (!secretStr || !signString) {
      return clickResponse(CLICK_ERRORS.SIGN_CHECK_FAILED, 'SIGN CHECK FAILED');
    }

    const expectedSign = computeClickSign(action, secretStr, {
      clickTransId,
      serviceId,
      merchantTransId,
      merchantPrepareId,
      amount,
      signTime,
    }).toLowerCase();

    if (!timingSafeEqualString(signString, expectedSign)) {
      return clickResponse(CLICK_ERRORS.SIGN_CHECK_FAILED, 'SIGN CHECK FAILED');
    }

    if (action === 0) {
      return this.handlePrepare(body, port);
    }
    if (action === 1) {
      return this.handleComplete(body, error, port);
    }
    return clickResponse(CLICK_ERRORS.ACTION_NOT_FOUND, 'Action not found');
  }

  private async handlePrepare(
    body: ClickCallbackBody,
    port: OnlinePaymentPort,
  ): Promise<CallbackResponse> {
    const clickTransId = String(body.click_trans_id);
    const orderId = String(body.merchant_trans_id);
    const amount = String(body.amount);

    const existing = await port.findPayment({
      providerCode: 'CLICK',
      providerTransId: clickTransId,
    });
    if (existing) {
      return clickResponse(CLICK_ERRORS.SUCCESS, 'Success', {
        click_trans_id: Number(clickTransId),
        merchant_trans_id: orderId,
        merchant_prepare_id: existing.id,
      });
    }

    const order = await port.findOrderForPayment(orderId);
    if (!order) {
      return clickResponse(CLICK_ERRORS.ORDER_NOT_FOUND, 'User does not exist');
    }

    if (Number(order.totalAmount) !== Number(amount)) {
      return clickResponse(
        CLICK_ERRORS.INCORRECT_AMOUNT,
        'Incorrect parameter amount',
      );
    }

    if (order.statusCode === 'DONE' || order.saleId !== null) {
      return clickResponse(CLICK_ERRORS.ALREADY_PAID, 'Already paid');
    }

    if (
      order.paymentMethodCode !== 'ONLINE' ||
      order.statusCode === 'CANCELLED' ||
      !order.hasStock
    ) {
      return clickResponse(
        CLICK_ERRORS.CANNOT_PERFORM,
        'Failed to update user',
      );
    }

    try {
      const p = await port.startPayment({
        orderId,
        providerCode: 'CLICK',
        amount: order.totalAmount,
        providerTransId: clickTransId,
        rawPayload: body,
      });
      return clickResponse(CLICK_ERRORS.SUCCESS, 'Success', {
        click_trans_id: Number(clickTransId),
        merchant_trans_id: orderId,
        merchant_prepare_id: p.id,
      });
    } catch {
      return clickResponse(
        CLICK_ERRORS.CANNOT_PERFORM,
        'Failed to update user',
      );
    }
  }

  private async handleComplete(
    body: ClickCallbackBody,
    error: number,
    port: OnlinePaymentPort,
  ): Promise<CallbackResponse> {
    const clickTransId = String(body.click_trans_id);
    const orderId = String(body.merchant_trans_id);
    const prepareId = String(body.merchant_prepare_id ?? '');

    const payment = await port.findPayment({
      paymentId: prepareId || undefined,
      providerCode: 'CLICK',
      providerTransId: clickTransId,
    });
    if (!payment) {
      return clickResponse(
        CLICK_ERRORS.TRANSACTION_NOT_FOUND,
        'Transaction does not exist',
      );
    }

    if (error < 0) {
      await port.cancelPayment({
        paymentId: payment.id,
        providerCode: 'CLICK',
        providerTransId: clickTransId,
        reason: String(body.error_note ?? 'Cancelled by Click'),
        rawPayload: body,
      });
      return clickResponse(
        CLICK_ERRORS.TRANSACTION_CANCELLED,
        'Transaction cancelled',
        {
          click_trans_id: Number(clickTransId),
          merchant_trans_id: orderId,
          merchant_confirm_id: null,
        },
      );
    }

    if (payment.statusCode === 'PAID') {
      return clickResponse(CLICK_ERRORS.SUCCESS, 'Already paid', {
        click_trans_id: Number(clickTransId),
        merchant_trans_id: orderId,
        merchant_confirm_id: payment.id,
      });
    }

    if (payment.statusCode === 'CANCELLED') {
      return clickResponse(
        CLICK_ERRORS.TRANSACTION_CANCELLED,
        'Transaction cancelled',
      );
    }

    const paid = await port.markPaid({
      paymentId: payment.id,
      providerCode: 'CLICK',
      providerTransId: clickTransId,
      rawPayload: body,
    });
    return clickResponse(CLICK_ERRORS.SUCCESS, 'Success', {
      click_trans_id: Number(clickTransId),
      merchant_trans_id: orderId,
      merchant_confirm_id: paid.id,
    });
  }
}
