import { NotFoundException } from '@nestjs/common';
import type { OnlinePaymentProvider } from './online-payment.provider.js';

/**
 * Resolves a payment gateway adapter by provider code.
 * Injected with all available adapters so core services never switch on provider code.
 */
export class ProviderRegistry {
  private readonly byCode: Map<string, OnlinePaymentProvider>;

  constructor(adapters: OnlinePaymentProvider[]) {
    this.byCode = new Map(adapters.map((a) => [a.code, a]));
  }

  get(code: string): OnlinePaymentProvider {
    const adapter = this.byCode.get(code);
    if (!adapter) {
      throw new NotFoundException(`No payment adapter registered for ${code}`);
    }
    return adapter;
  }

  has(code: string): boolean {
    return this.byCode.has(code);
  }

  codes(): string[] {
    return [...this.byCode.keys()];
  }
}
