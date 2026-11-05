import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { CustomsRepository } from './customs.repository.js';
import { CustomsService } from './customs.service.js';

const D = (n: number | string) => new Prisma.Decimal(n);

function build(
  overrides: Partial<Record<keyof CustomsRepository, unknown>> = {},
) {
  const repo = {
    create: jest.fn(),
    listVersions: jest.fn().mockResolvedValue([]),
    twoNewest: jest.fn().mockResolvedValue([]),
    feeHistory: jest.fn().mockResolvedValue([]),
    modelCustomsCodes: jest.fn().mockResolvedValue(new Set<string>()),
    activeModels: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as CustomsRepository;
  return { service: new CustomsService(repo), repo };
}

describe('CustomsService.createPriceList', () => {
  it('rejects duplicate customs codes in one payload', async () => {
    const { service } = build();
    await expect(
      service.createPriceList(
        {
          items: [
            { customsCode: 'A', fee: 1 },
            { customsCode: 'A', fee: 2 },
          ],
        },
        'user-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('CustomsService.currentList', () => {
  it('returns each item with the previous version fee and model usage', async () => {
    const { service } = build({
      twoNewest: jest.fn().mockResolvedValue([
        {
          id: 'v2',
          effectiveAt: new Date('2026-11-05'),
          note: null,
          items: [
            { customsCode: 'A', description: 'iPhone', fee: D(120) },
            { customsCode: 'B', description: null, fee: D(90) },
          ],
        },
        {
          id: 'v1',
          effectiveAt: new Date('2026-08-01'),
          note: null,
          items: [{ customsCode: 'A', description: 'iPhone', fee: D(100) }],
        },
      ]),
      modelCustomsCodes: jest.fn().mockResolvedValue(new Set(['A'])),
    });
    const result = await service.currentList();
    expect(result?.id).toBe('v2');
    expect(result?.items).toEqual([
      {
        customsCode: 'A',
        description: 'iPhone',
        fee: '120.00',
        previousFee: '100.00',
        usedByModel: true,
      },
      {
        customsCode: 'B',
        description: null,
        fee: '90.00',
        previousFee: null,
        usedByModel: false,
      },
    ]);
  });

  it('is null when no list exists', async () => {
    const { service } = build();
    expect(await service.currentList()).toBeNull();
  });
});

describe('CustomsService.currentFeeMap', () => {
  it('maps the current list codes to numeric fees', async () => {
    const { service } = build({
      twoNewest: jest.fn().mockResolvedValue([
        {
          id: 'v1',
          effectiveAt: new Date(),
          note: null,
          items: [{ customsCode: 'A', description: null, fee: D(120) }],
        },
      ]),
    });
    const map = await service.currentFeeMap();
    expect(map.get('A')).toBe(120);
  });
});

describe('CustomsService.unmatchedModels', () => {
  it('flags models with no code and codes missing from the current list', async () => {
    const { service } = build({
      twoNewest: jest.fn().mockResolvedValue([
        {
          id: 'v1',
          effectiveAt: new Date(),
          note: null,
          items: [{ customsCode: 'A', description: null, fee: D(1) }],
        },
      ]),
      activeModels: jest.fn().mockResolvedValue([
        { id: 'm1', brand: 'Apple', name: 'X', customsCode: 'A' },
        { id: 'm2', brand: 'Apple', name: 'Y', customsCode: null },
        { id: 'm3', brand: 'Apple', name: 'Z', customsCode: 'Q' },
      ]),
    });
    const result = await service.unmatchedModels();
    expect(result).toEqual([
      {
        id: 'm2',
        brand: 'Apple',
        name: 'Y',
        customsCode: null,
        reason: 'MISSING_CODE',
      },
      {
        id: 'm3',
        brand: 'Apple',
        name: 'Z',
        customsCode: 'Q',
        reason: 'CODE_NOT_IN_CURRENT_LIST',
      },
    ]);
  });
});
