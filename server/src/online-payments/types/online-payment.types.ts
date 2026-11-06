export interface CallbackRequest {
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
  ip?: string;
}

export interface CallbackResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: unknown;
}

export interface PaymentOrderInfo {
  id: string;
  orderNumber: string;
  storeId: string;
  modelId: string;
  specs: Record<string, unknown>;
  paymentMethodCode: string;
  statusCode: string;
  priceSnapshot: string | null;
  deliveryFeeSnapshot: string;
  totalAmount: string;
  deviceId: string | null;
  saleId: string | null;
  hasStock: boolean;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  providerCode: string;
  statusCode: string;
  amount: string;
  providerTransId: string | null;
  providerPrepareId: string | null;
  rawPayload: unknown;
  reason: string | null;
  paidAt: Date | null;
  cancelledAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StartPaymentParams {
  orderId: string;
  providerCode: string;
  amount: string;
  providerTransId?: string;
  providerPrepareId?: string;
  rawPayload?: unknown;
}

export interface MarkPaidParams {
  paymentId?: string;
  providerCode: string;
  providerTransId?: string;
  rawPayload?: unknown;
}

export interface CancelPaymentParams {
  paymentId?: string;
  providerCode: string;
  providerTransId?: string;
  reason?: string;
  rawPayload?: unknown;
}

export interface FindPaymentParams {
  paymentId?: string;
  providerCode?: string;
  providerTransId?: string;
  providerPrepareId?: string;
  orderId?: string;
}

export interface ListPaymentsParams {
  providerCode: string;
  from: Date;
  to: Date;
}

export interface ProviderConfigView {
  providerCode: string;
  label: string;
  isEnabled: boolean;
  isTestMode: boolean;
  allowedIps: string[] | null;
  settings: Record<string, unknown>;
  secretStatus: 'set' | 'missing' | 'unreadable';
}

export interface PaymeSettings {
  merchantId?: string;
  testMerchantId?: string;
}

export interface ClickSettings {
  serviceId?: string;
  merchantId?: string;
  merchantUserId?: string;
}
