import { createHash } from 'node:crypto';
import type { CallbackResponse } from '../types/online-payment.types.js';

export const CLICK_ERRORS = {
  SUCCESS: 0,
  SIGN_CHECK_FAILED: -1,
  INCORRECT_AMOUNT: -2,
  ACTION_NOT_FOUND: -3,
  ALREADY_PAID: -4,
  ORDER_NOT_FOUND: -5,
  TRANSACTION_NOT_FOUND: -6,
  CANNOT_PERFORM: -7,
  ERROR_IN_REQUEST: -8,
  TRANSACTION_CANCELLED: -9,
} as const;

export function clickResponse(
  error: number,
  errorNote: string,
  extra: Record<string, unknown> = {},
): CallbackResponse {
  return {
    statusCode: 200,
    body: {
      error,
      error_note: errorNote,
      ...extra,
    },
  };
}

export function computeClickSign(
  action: number,
  secret: string,
  params: {
    clickTransId: string;
    serviceId: string;
    merchantTransId: string;
    merchantPrepareId?: string;
    amount: string;
    signTime: string;
  },
): string {
  const parts =
    action === 0
      ? [
          params.clickTransId,
          params.serviceId,
          secret,
          params.merchantTransId,
          params.amount,
          action,
          params.signTime,
        ]
      : [
          params.clickTransId,
          params.serviceId,
          secret,
          params.merchantTransId,
          params.merchantPrepareId ?? '',
          params.amount,
          action,
          params.signTime,
        ];
  return createHash('md5').update(parts.join('')).digest('hex');
}
