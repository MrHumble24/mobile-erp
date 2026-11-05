import { SyncHandlerRegistry } from './handler-registry.js';
import type { SyncHandler } from './sync-handler.interface.js';

const stub = {} as SyncHandler;

/**
 * Selling on credit is online only — the credit limit must be checked, which an
 * offline till cannot do (ADR 0035). The sync push therefore has no credit
 * handler, so a queued credit mutation is rejected as an unknown type.
 */
describe('SyncHandlerRegistry (customer credit is online-only)', () => {
  const registry = new SyncHandlerRegistry(stub, stub, stub, stub);

  it('has no handler for credit.create (so the push rejects it)', () => {
    expect(registry.get('credit.create')).toBeUndefined();
    expect(registry.get('credit.payment')).toBeUndefined();
  });

  it('still routes a normal sale', () => {
    expect(registry.get('sale.create')).toBe(stub);
  });
});
