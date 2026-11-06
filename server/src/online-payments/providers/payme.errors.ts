import type { CallbackResponse } from '../types/online-payment.types.js';

export interface PaymeAccountParams {
  order_id?: string;
  [key: string]: unknown;
}

export interface PaymeParams {
  id?: string;
  account?: PaymeAccountParams;
  amount?: number;
  reason?: number | string;
  from?: number;
  to?: number;
  time?: number;
  [key: string]: unknown;
}

export interface PaymeError {
  code: number;
  message: { ru: string; uz: string; en: string };
  data?: string;
}

export const PAYME_ERRORS = {
  AUTH_FAILED: {
    code: -32504,
    message: {
      ru: 'Недостаточно привилегий',
      uz: 'Imtiyozlar yetarli emas',
      en: 'Insufficient privileges',
    },
  },
  INVALID_JSON_RPC: {
    code: -32600,
    message: {
      ru: 'Неверный JSON-RPC запрос',
      uz: 'Noto‘g‘ri JSON-RPC so‘rovi',
      en: 'Invalid JSON-RPC request',
    },
  },
  METHOD_NOT_FOUND: {
    code: -32601,
    message: {
      ru: 'Метод не найден',
      uz: 'Usul topilmadi',
      en: 'Method not found',
    },
  },
  ORDER_NOT_FOUND: {
    code: -31001,
    message: {
      ru: 'Заказ не найден',
      uz: 'Buyurtma topilmadi',
      en: 'Order not found',
    },
    data: 'order_id',
  },
  TRANSACTION_NOT_FOUND: {
    code: -31003,
    message: {
      ru: 'Транзакция не найдена',
      uz: 'Tranzaksiya topilmadi',
      en: 'Transaction not found',
    },
  },
  CANNOT_PERFORM: {
    code: -31007,
    message: {
      ru: 'Невозможно выполнить операцию',
      uz: 'Amalni bajarib bo‘lmaydi',
      en: 'Unable to perform operation',
    },
  },
  CANNOT_CANCEL: {
    code: -31008,
    message: {
      ru: 'Невозможно отменить транзакцию',
      uz: 'Tranzaksiyani bekor qilish mumkin emas',
      en: 'Unable to cancel transaction',
    },
  },
  WRONG_AMOUNT: {
    code: -32300,
    message: {
      ru: 'Неверная сумма',
      uz: 'Noto‘g‘ri summa',
      en: 'Incorrect amount',
    },
    data: 'amount',
  },
} as const satisfies Record<string, PaymeError>;

export function rpcSuccess(id: unknown, result: unknown): CallbackResponse {
  return { statusCode: 200, body: { jsonrpc: '2.0', id, result } };
}

export function rpcError(id: unknown, error: PaymeError): CallbackResponse {
  return { statusCode: 200, body: { jsonrpc: '2.0', id, error } };
}

export function getPaymeState(p: { statusCode: string }): number {
  if (p.statusCode === 'CREATED') return 1;
  if (p.statusCode === 'PAID') return 2;
  if (p.statusCode === 'CANCELLED') return -1;
  return -2; // REFUND_DUE or REFUNDED
}

export function mapStatementTransaction(p: {
  id: string;
  orderId: string;
  statusCode: string;
  amount: string;
  providerTransId: string | null;
  reason: string | null;
  paidAt: Date | null;
  cancelledAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: p.providerTransId,
    time: p.createdAt.getTime(),
    amount: Math.round(Number(p.amount) * 100),
    account: { order_id: p.orderId },
    create_time: p.createdAt.getTime(),
    perform_time: p.paidAt?.getTime() ?? 0,
    cancel_time: (p.cancelledAt ?? p.refundedAt)?.getTime() ?? 0,
    transaction: p.id,
    state: getPaymeState(p),
    reason: p.reason ? Number(p.reason) || null : null,
  };
}
