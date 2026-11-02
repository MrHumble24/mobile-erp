import { buildCustomerWhere, sortCustomers } from './customer-query.js';

describe('buildCustomerWhere', () => {
  it('is empty when no filters are given', () => {
    expect(buildCustomerWhere()).toEqual({});
    expect(buildCustomerWhere('   ')).toEqual({});
  });

  it('matches name or phone case-insensitively', () => {
    expect(buildCustomerWhere('ali')).toEqual({
      AND: [
        {
          OR: [
            { name: { contains: 'ali', mode: 'insensitive' } },
            { phone: { contains: 'ali', mode: 'insensitive' } },
          ],
        },
      ],
    });
  });

  it('filters by presence and absence of purchases', () => {
    expect(buildCustomerWhere(undefined, true)).toEqual({
      AND: [{ sales: { some: {} } }],
    });
    expect(buildCustomerWhere(undefined, false)).toEqual({
      AND: [{ sales: { none: {} } }],
    });
  });

  it('combines search and purchase filters', () => {
    const where = buildCustomerWhere('ali', true);
    expect(where.AND).toHaveLength(2);
  });
});

describe('sortCustomers', () => {
  const rows = () => [
    { name: 'Bek', lastPurchaseAt: new Date('2024-01-01') },
    { name: 'Ali', lastPurchaseAt: new Date('2024-03-01') },
    { name: 'Dilnoza', lastPurchaseAt: null },
  ];

  it('sorts by name A→Z', () => {
    const items = rows();
    sortCustomers(items, 'name');
    expect(items.map((r) => r.name)).toEqual(['Ali', 'Bek', 'Dilnoza']);
  });

  it('sorts by most recent purchase, nulls last', () => {
    const items = rows();
    sortCustomers(items, 'recent');
    expect(items.map((r) => r.name)).toEqual(['Ali', 'Bek', 'Dilnoza']);
  });
});
