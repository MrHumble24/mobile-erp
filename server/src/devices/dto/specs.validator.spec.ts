import { isSpecsObject } from './specs.validator.js';

describe('isSpecsObject', () => {
  it('accepts a flat map of scalar values', () => {
    expect(
      isSpecsObject({ storage: '128GB', ram: 8, dualSim: true, color: null }),
    ).toBe(true);
  });

  it('accepts an empty object', () => {
    expect(isSpecsObject({})).toBe(true);
  });

  it('rejects non-objects, arrays and null', () => {
    expect(isSpecsObject(null)).toBe(false);
    expect(isSpecsObject('x')).toBe(false);
    expect(isSpecsObject([{ a: 1 }])).toBe(false);
  });

  it('rejects nested objects (must be flat)', () => {
    expect(isSpecsObject({ battery: { health: 90 } })).toBe(false);
  });

  it('rejects keys that break the pattern or exceed 40 chars', () => {
    expect(isSpecsObject({ 'bad key': 1 })).toBe(false);
    expect(isSpecsObject({ ['k'.repeat(41)]: 1 })).toBe(false);
  });

  it('rejects more than 50 keys', () => {
    const big = Object.fromEntries(
      Array.from({ length: 51 }, (_, i) => [`k${i}`, i]),
    );
    expect(isSpecsObject(big)).toBe(false);
  });

  it('rejects string values longer than 200 chars', () => {
    expect(isSpecsObject({ note: 'a'.repeat(201) })).toBe(false);
    expect(isSpecsObject({ note: 'a'.repeat(200) })).toBe(true);
  });
});
