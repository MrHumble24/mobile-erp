import { SyncHandlerRegistry } from './handler-registry.js';

// A registry smoke test only needs a value per constructor slot.
const stub = {} as unknown as never;
const registry = new SyncHandlerRegistry(
  stub, stub, stub, stub,
  stub, stub, stub, stub, stub, stub, stub, stub,
);

/**
 * Selling on credit is online only — the credit limit must be checked, which an
 * offline till cannot do (ADR 0035). The sync push therefore has no credit
 * handler, so a queued credit mutation is rejected as an unknown type.
 */
describe('SyncHandlerRegistry (customer credit is online-only)', () => {
  it('has no handler for credit.create (so the push rejects it)', () => {
    expect(registry.get('credit.create')).toBeUndefined();
    expect(registry.get('credit.payment')).toBeUndefined();
  });

  it('still routes a normal sale', () => {
    expect(registry.get('sale.create')).toBe(stub);
  });
});

describe('SyncHandlerRegistry (repair offline writes)', () => {
  const types = [
    'repair.create',
    'repair.update',
    'repair.status',
    'repair.payment',
    'repair.refund',
    'repair.outside',
    'repair.part.add',
    'repair.part.remove',
  ];

  it.each(types)('routes %s', (type) => {
    expect(registry.get(type)).toBe(stub);
  });
});
