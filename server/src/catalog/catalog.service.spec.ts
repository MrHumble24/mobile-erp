import { Prisma } from '../generated/client/client.js';
import { StoresService } from '../stores/stores.service.js';
import { CatalogRepository } from './catalog.repository.js';
import { CatalogService } from './catalog.service.js';

function build() {
  const repo = {
    unitProducts: jest.fn().mockResolvedValue([]),
    quantityProducts: jest.fn().mockResolvedValue([]),
    sellableUnits: jest.fn().mockResolvedValue([]),
  };
  const stores = { currentStoreId: jest.fn().mockResolvedValue('store-1') };
  const service = new CatalogService(
    repo as unknown as CatalogRepository,
    stores as unknown as StoresService,
  );
  return { service, repo };
}

describe('CatalogService.list', () => {
  it('maps an IMEI product with its unit count and price range (no salePrice)', async () => {
    const { service, repo } = build();
    repo.unitProducts.mockResolvedValue([
      {
        modelId: 'm1',
        brand: 'Apple',
        name: 'iPhone 15',
        kindCode: 'IMEI',
        categoryId: 'c1',
        categoryName: 'Phones',
        imageFileName: 'pic.png',
        inStock: 3,
        minTargetPrice: new Prisma.Decimal('900'),
        maxTargetPrice: new Prisma.Decimal('1100'),
      },
    ]);
    const [entry] = await service.list({});
    expect(entry).toMatchObject({
      modelId: 'm1',
      kindCode: 'IMEI',
      inStock: 3,
      minTargetPrice: '900.00',
      maxTargetPrice: '1100.00',
      salePrice: null,
      imageUrl: '/uploads/pic.png',
    });
  });

  it('maps an active QUANTITY product including zero/negative stock (no price range)', async () => {
    const { service, repo } = build();
    repo.quantityProducts.mockResolvedValue([
      {
        modelId: 'q1',
        brand: 'Generic',
        name: 'USB-C Cable',
        kindCode: 'QUANTITY',
        categoryId: null,
        categoryName: null,
        imageFileName: null,
        salePrice: new Prisma.Decimal('5'),
        quantity: 0,
      },
    ]);
    const [entry] = await service.list({});
    expect(entry).toMatchObject({
      modelId: 'q1',
      kindCode: 'QUANTITY',
      inStock: 0,
      minTargetPrice: null,
      maxTargetPrice: null,
      salePrice: '5.00',
      imageUrl: null,
    });
  });

  it('sorts the merged list by brand then name', async () => {
    const { service, repo } = build();
    repo.unitProducts.mockResolvedValue([
      {
        modelId: 'u',
        brand: 'Samsung',
        name: 'S24',
        kindCode: 'IMEI',
        categoryId: null,
        categoryName: null,
        imageFileName: null,
        inStock: 1,
        minTargetPrice: null,
        maxTargetPrice: null,
      },
    ]);
    repo.quantityProducts.mockResolvedValue([
      {
        modelId: 'q',
        brand: 'Apple',
        name: 'Cable',
        kindCode: 'QUANTITY',
        categoryId: null,
        categoryName: null,
        imageFileName: null,
        salePrice: null,
        quantity: 2,
      },
    ]);
    const list = await service.list({});
    expect(list.map((e) => e.brand)).toEqual(['Apple', 'Samsung']);
  });
});

describe('CatalogService.units', () => {
  it('maps a unit code to imei or serial and formats its price', async () => {
    const { service, repo } = build();
    repo.sellableUnits.mockResolvedValue([
      {
        id: 'd1',
        imei: '359824370000001',
        serialNumber: null,
        specs: { storage: '256GB' },
        gradeCode: 'A',
        targetPrice: new Prisma.Decimal('1000'),
      },
      {
        id: 'd2',
        imei: null,
        serialNumber: 'SN123',
        specs: {},
        gradeCode: null,
        targetPrice: null,
      },
    ]);
    const units = await service.units('m1');
    expect(units[0]).toMatchObject({
      id: 'd1',
      code: '359824370000001',
      gradeCode: 'A',
      targetPrice: '1000.00',
    });
    expect(units[1]).toMatchObject({
      id: 'd2',
      code: 'SN123',
      gradeCode: null,
      targetPrice: null,
    });
  });
});
