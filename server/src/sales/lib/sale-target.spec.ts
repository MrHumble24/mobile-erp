import { resolveSaleTarget } from './sale-target.js';

describe('resolveSaleTarget', () => {
  it('resolves a unit sale by imei', () => {
    expect(resolveSaleTarget({ imei: '123456789012345' })).toEqual({
      kind: 'unit',
      code: '123456789012345',
    });
  });

  it('resolves a quantity sale', () => {
    expect(resolveSaleTarget({ modelId: 'm1', quantity: 3 })).toEqual({
      kind: 'quantity',
      modelId: 'm1',
      quantity: 3,
    });
  });

  it('rejects mixing a unit and a quantity product', () => {
    expect(() =>
      resolveSaleTarget({
        imei: '123456789012345',
        modelId: 'm1',
        quantity: 1,
      }),
    ).toThrow();
  });

  it('rejects a quantity sale missing the quantity', () => {
    expect(() => resolveSaleTarget({ modelId: 'm1' })).toThrow();
  });

  it('rejects neither way', () => {
    expect(() => resolveSaleTarget({})).toThrow();
  });
});
