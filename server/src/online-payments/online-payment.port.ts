import type {
  CancelPaymentParams,
  FindPaymentParams,
  ListPaymentsParams,
  MarkPaidParams,
  PaymentOrderInfo,
  PaymentRecord,
  StartPaymentParams,
} from './types/online-payment.types.js';

/**
 * Port contract that separates provider adapters from internal order/stock/ledger details.
 * Provider adapters only interact through this port and never talk to Prisma directly.
 */
export interface OnlinePaymentPort {
  findOrderForPayment(orderId: string): Promise<PaymentOrderInfo | null>;
  startPayment(params: StartPaymentParams): Promise<PaymentRecord>;
  markPaid(params: MarkPaidParams): Promise<PaymentRecord>;
  cancelPayment(params: CancelPaymentParams): Promise<PaymentRecord>;
  findPayment(params: FindPaymentParams): Promise<PaymentRecord | null>;
  listPaymentsForPeriod(params: ListPaymentsParams): Promise<PaymentRecord[]>;
}
