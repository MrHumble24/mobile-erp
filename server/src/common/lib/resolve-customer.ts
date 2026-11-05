import type { PrismaTx } from '../types/prisma-tx.js';

export interface CustomerResolveInput {
  customerId?: string;
  inlineCustomer?: { name: string; phone?: string };
}

/**
 * Resolve the customer for a POS write (checkout, trade-in, customer purchase):
 * an existing id wins; otherwise an inline customer is upserted by phone (or
 * created without one). Runs inside the caller's transaction. Returns undefined
 * when neither is given — callers that require a customer reject that.
 */
export async function resolveCustomerId(
  tx: PrismaTx,
  input: CustomerResolveInput,
): Promise<string | undefined> {
  if (input.customerId) return input.customerId;
  const inline = input.inlineCustomer;
  if (!inline) return undefined;
  if (inline.phone) {
    const c = await tx.customer.upsert({
      where: { phone: inline.phone },
      update: { name: inline.name },
      create: { name: inline.name, phone: inline.phone },
      select: { id: true },
    });
    return c.id;
  }
  const c = await tx.customer.create({
    data: { name: inline.name },
    select: { id: true },
  });
  return c.id;
}
