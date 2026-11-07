import {
  computeAcquisitionCost,
  parseStorageAndModelName,
  resolveModelForImport,
  splitExpense,
} from './batch-row-calc.js';

describe('computeAcquisitionCost', () => {
  it('divides price by rate and rounds to 2 decimal places (550 / 1.3 = 423.08)', () => {
    expect(computeAcquisitionCost(550, 1.3)).toBe(423.08);
  });

  it('handles exact division and 0 rate safely', () => {
    expect(computeAcquisitionCost(520, 1.3)).toBe(400);
    expect(computeAcquisitionCost(100, 0)).toBe(0);
  });
});

describe('splitExpense', () => {
  it('expense 70 with fee 65 -> customs 65, expense 5, no warning', () => {
    const res = splitExpense(70, 65);
    expect(res.customsFee).toBe(65);
    expect(res.unitExpense).toBe(5);
    expect(res.unitExpenseNote).toBe('Приход');
    expect(res.warning).toBeUndefined();
  });

  it('expense 70 with no fee -> customs 0, expense 70, no warning', () => {
    const res = splitExpense(70, 0);
    expect(res.customsFee).toBe(0);
    expect(res.unitExpense).toBe(70);
    expect(res.unitExpenseNote).toBe('Приход');
    expect(res.warning).toBeUndefined();
  });

  it('expense 50 with fee 65 -> customs 50, expense 0, warning', () => {
    const res = splitExpense(50, 65);
    expect(res.customsFee).toBe(50);
    expect(res.unitExpense).toBe(0);
    expect(res.unitExpenseNote).toBe('Приход');
    expect(res.warning).toBeDefined();
    expect(res.warning).toContain('50');
    expect(res.warning).toContain('65');
  });
});

describe('parseStorageAndModelName', () => {
  it('strips storage suffix and normalizes it', () => {
    expect(parseStorageAndModelName('iPhone 13 Pro Max 256 GB')).toEqual({
      storage: '256GB',
      baseModelName: 'iPhone 13 Pro Max',
    });
    expect(parseStorageAndModelName('iPhone 15 Pro 128GB')).toEqual({
      storage: '128GB',
      baseModelName: 'iPhone 15 Pro',
    });
    expect(parseStorageAndModelName('iPad Pro 1 TB')).toEqual({
      storage: '1TB',
      baseModelName: 'iPad Pro',
    });
  });

  it('returns raw name as baseModelName when no storage suffix', () => {
    expect(parseStorageAndModelName('S24 Ultra')).toEqual({
      baseModelName: 'S24 Ultra',
    });
  });
});

describe('resolveModelForImport', () => {
  const models = [
    {
      id: 'm1',
      brand: 'Apple',
      name: 'iPhone 15 Pro',
      kindCode: 'IMEI',
      customsCode: 'iPhone 15 Pro',
    },
    {
      id: 'm2',
      brand: 'Samsung',
      name: 'Galaxy S24 Ultra',
      kindCode: 'IMEI',
      customsCode: 'S24 Ultra',
    },
    {
      id: 'm3',
      brand: 'Apple',
      name: 'iPhone 13',
      kindCode: 'IMEI',
      customsCode: null,
    },
  ];

  it('matches via customsCode', () => {
    const res = resolveModelForImport(
      models,
      'iPhone 15 Pro',
      'iPhone 15 Pro 256 GB',
    );
    expect(res.model?.id).toBe('m1');
    expect(res.error).toBeUndefined();
  });

  it('matches via name when customsCode is absent', () => {
    const res = resolveModelForImport(models, 'iPhone 13', 'iPhone 13 128 GB');
    expect(res.model?.id).toBe('m3');
  });

  it('returns error when no model matches', () => {
    const res = resolveModelForImport(
      models,
      'Unknown Model',
      'Unknown Model 256 GB',
    );
    expect(res.model).toBeUndefined();
    expect(res.error).toContain('not found');
  });
});
