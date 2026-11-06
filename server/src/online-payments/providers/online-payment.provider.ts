import type { OnlinePaymentPort } from '../online-payment.port.js';
import type {
  CallbackRequest,
  CallbackResponse,
} from '../types/online-payment.types.js';

export interface CheckoutUrlParams {
  orderId: string;
  amount: string;
  returnUrl: string;
}

/**
 * Adapter interface for online payment gateways (ADR 0063).
 * Modeled on BackupStorage: one file per gateway, pluggable via ProviderRegistry.
 */
export interface OnlinePaymentProvider {
  readonly code: string;

  /** Validates that provider settings and secret are properly configured and operational. */
  validate(config: unknown, secret: unknown): Promise<void>;

  /** Builds the gateway checkout redirect URL for customer redirection. */
  checkoutUrl(params: CheckoutUrlParams, config: unknown): string;

  /**
   * Handles incoming webhooks / callback calls from the gateway.
   * Proves request authenticity, calls port methods, and crafts gateway-specific response.
   */
  handleCallback(
    request: CallbackRequest,
    config: unknown,
    secret: unknown,
    port: OnlinePaymentPort,
  ): Promise<CallbackResponse>;
}
