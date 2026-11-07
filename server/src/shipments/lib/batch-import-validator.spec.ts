import type { DeviceModelView } from '../../device-models/types/device-model.types.js';
import { validateAndPrepareBatchImport } from './batch-import-validator.js';

describe('validateAndPrepareBatchImport', () => {
  const models: DeviceModelView[] = [
    {
      id: 'm1',
      brand: 'Apple',
      name: 'iPhone 15 Pro',
      kindCode: 'IMEI',
      customsCode: 'iPhone 15 Pro',
      isActive: true,
      categoryId: null,
      barcode: null,
      modelCode: null,
      salePrice: null,
      imageFileName: null,
      attributes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  const feeMap = new Map<string, number>([['IPHONE 15 PRO 256GB', 94]]);

  it('validates a sheet with 3 rows where each row has a problem (step d)', () => {
    // 3 rows:
    // row 3: iPhone with duplicate IMEI
    // row 4: Non-existent model
    // row 5: Duplicate IMEI (same as row 3)
    const rows = [
      {
        row: 3,
        modelName: 'iPhone 15 Pro 256 GB',
        imei: '351339414137676',
        expense: 70,
        price: 550,
      },
      {
        row: 4,
        modelName: 'NonExistentModel 128 GB',
        imei: '351339414137677',
        expense: 50,
        price: 400,
      },
      {
        row: 5,
        modelName: 'iPhone 15 Pro 256 GB',
        imei: '351339414137676', // duplicate
        expense: 70,
        price: 550,
      },
    ];

    const result = validateAndPrepareBatchImport(
      rows,
      1.3,
      models,
      new Set(),
      feeMap,
    );

    expect(result.problems).toHaveLength(3);
    expect(result.problems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ row: 3, code: 'DUPLICATE_IMEI' }),
        expect.objectContaining({ row: 4, code: 'MODEL_NOT_FOUND' }),
        expect.objectContaining({ row: 5, code: 'DUPLICATE_IMEI' }),
      ]),
    );
    expect(result.deviceInputs).toHaveLength(0);
  });

  it('successfully validates and prepares clean rows with rate 1.3 (step e)', () => {
    const rows = [
      {
        row: 3,
        modelName: 'iPhone 15 Pro 256 GB',
        imei: '351339414137676',
        expense: 100,
        price: 550,
        markup: 30,
        batteryHealth: 88,
        defects: 'Clean',
      },
    ];

    const result = validateAndPrepareBatchImport(
      rows,
      1.3,
      models,
      new Set(),
      feeMap,
    );

    expect(result.problems).toHaveLength(0);
    expect(result.deviceInputs).toHaveLength(1);
    const d = result.deviceInputs[0];
    expect(d.acquisitionCost).toBe(423.08); // 550 / 1.3
    expect(d.acquisitionCostOriginal).toBe(550);
    expect(d.customsFee).toBe(94);
    expect(d.unitExpense).toBe(6); // 100 - 94
    expect(d.targetPrice).toBe(453.08); // 423.08 + 30
    expect(d.specs).toEqual({
      storage: '256GB',
      batteryHealth: 88,
      defects: 'Clean',
    });
  });

  it('handles empty fee map: fee is 0, full expense is unitExpense (step f)', () => {
    const rows = [
      {
        row: 3,
        modelName: 'iPhone 15 Pro 256 GB',
        imei: '351339414137676',
        expense: 70,
        price: 550,
      },
    ];

    const result = validateAndPrepareBatchImport(
      rows,
      1.3,
      models,
      new Set(),
      new Map(), // no customs list
    );

    expect(result.problems).toHaveLength(0);
    const d = result.deviceInputs[0];
    expect(d.customsFee).toBe(0);
    expect(d.unitExpense).toBe(70);
  });
});
