import { Prisma } from '../../generated/client/client.js';
import type { PricingService } from '../../pricing/pricing.service.js';
import type {
  PublicModelRow,
  PublicUnitRow,
} from '../storefront.repository.js';
import {
  buildQuantityProductCards,
  buildQuantityProductDetail,
  buildUnitProductCards,
  buildUnitProductDetail,
} from './product-shaping.js';

const FORBIDDEN_KEY_REGEX =
  /imei|serial|cost|supplier|grade|landed|acquisition|password|email|permission/i;
const FIFTEEN_DIGIT_REGEX = /^\d{15}$/;

function assertNoLeaks(value: unknown, path = '$') {
  if (value === null || value === undefined) return;

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      value.forEach((item, idx) => assertNoLeaks(item, `${path}[${idx}]`));
    } else {
      for (const [k, v] of Object.entries(value)) {
        if (FORBIDDEN_KEY_REGEX.test(k)) {
          throw new Error(
            `Data leak detected: forbidden key "${k}" at ${path}.${k}`,
          );
        }
        if (typeof v === 'string' && FIFTEEN_DIGIT_REGEX.test(v.trim())) {
          throw new Error(
            `Data leak detected: 15-digit value "${v}" at ${path}.${k}`,
          );
        }
        if (typeof v === 'number' && FIFTEEN_DIGIT_REGEX.test(String(v))) {
          throw new Error(
            `Data leak detected: 15-digit number "${v}" at ${path}.${k}`,
          );
        }
        assertNoLeaks(v, `${path}.${k}`);
      }
    }
  } else if (
    typeof value === 'string' &&
    FIFTEEN_DIGIT_REGEX.test(value.trim())
  ) {
    throw new Error(`Data leak detected: 15-digit value "${value}" at ${path}`);
  }
}

describe('Storefront Shaping & Mapping Leak Invariant (In-Memory)', () => {
  const mockPricing = {
    listPriceForUnit: jest.fn().mockResolvedValue(new Prisma.Decimal(999)),
    listPriceForProduct: jest.fn().mockResolvedValue(new Prisma.Decimal(50)),
    pricesForUnits: jest.fn().mockImplementation((ctxs) => {
      const map = new Map();
      for (const c of ctxs) {
        map.set(c.deviceId, {
          RETAIL: c.targetPrice ?? new Prisma.Decimal(999),
        });
      }
      return Promise.resolve(map);
    }),
    pricesForProducts: jest.fn().mockImplementation((ctxs) => {
      const map = new Map();
      for (const c of ctxs) {
        map.set(c.modelId, { RETAIL: c.salePrice ?? new Prisma.Decimal(50) });
      }
      return Promise.resolve(map);
    }),
  } as unknown as PricingService;

  const storeMap = new Map([
    ['store-1', 'Branch Malika'],
    ['store-2', 'Branch Chilanzar'],
  ]);

  // Model and unit rows deliberately contaminated with confidential ERP fields
  const contaminatedModel: PublicModelRow & Record<string, unknown> = {
    id: 'model-uuid-1',
    brand: 'Apple',
    name: 'iPhone 15 Pro',
    kindCode: 'IMEI',
    categoryId: 'cat-uuid-1',
    category: { id: 'cat-uuid-1', name: 'Smartphones' },
    imageFileName: 'iphone15.webp',
    salePrice: new Prisma.Decimal(1200),
    customsCode: '8517130000',
    acquisitionCost: new Prisma.Decimal(900),
    landedCost: new Prisma.Decimal(950),
    supplierId: 'sup-1',
    supplier: { id: 'sup-1', name: 'Global Tech Wholesale' },
  };

  const contaminatedUnits: (PublicUnitRow & Record<string, unknown>)[] = [
    {
      id: 'unit-secret-db-id-1',
      modelId: 'model-uuid-1',
      storeId: 'store-1',
      specs: {
        storage: '256GB',
        color: 'Natural Titanium',
        imei: '354120581234567',
        serialNumber: 'SN987654321012345',
        unitExpense: 25,
        customsFee: 50,
      },
      targetPrice: new Prisma.Decimal(1150),
      imei: '354120581234567',
      ime2: '354120587654321',
      serialNumber: 'SN987654321012345',
      acquisitionCost: new Prisma.Decimal(850),
      landedCost: new Prisma.Decimal(890),
      grade: 'A+',
      qcNotes: 'Clean, no scratches',
      supplier: 'Secret Distributor LLC',
    },
    {
      id: 'unit-secret-db-id-2',
      modelId: 'model-uuid-1',
      storeId: 'store-2',
      specs: {
        storage: '512GB',
        color: 'Black Titanium',
      },
      targetPrice: new Prisma.Decimal(1350),
      imei: '861234567890123',
      acquisitionCost: new Prisma.Decimal(1000),
      landedCost: new Prisma.Decimal(1050),
      grade: 'New',
    },
  ];

  it('buildUnitProductCards strips sensitive unit and model fields', async () => {
    const unitsByModel = new Map([['model-uuid-1', contaminatedUnits]]);
    const cards = await buildUnitProductCards(
      [contaminatedModel],
      unitsByModel,
      storeMap,
      true,
      mockPricing,
    );

    expect(cards).toHaveLength(1);
    expect(cards[0].inStock).toBe(2);
    assertNoLeaks(cards, 'cards');
  });

  it('buildQuantityProductCards strips sensitive model and pricing fields', async () => {
    const quantityModel: PublicModelRow & Record<string, unknown> = {
      id: 'model-qty-1',
      brand: 'Baseus',
      name: 'USB-C Cable 100W',
      kindCode: 'QUANTITY',
      categoryId: 'cat-acc-1',
      category: { id: 'cat-acc-1', name: 'Accessories' },
      imageFileName: 'cable.webp',
      salePrice: new Prisma.Decimal(15),
      acquisitionCost: new Prisma.Decimal(5),
      supplier: 'Baseus Direct',
    };
    const qtyStock = new Map([
      [
        'model-qty-1',
        new Map([
          ['store-1', 40],
          ['store-2', 15],
        ]),
      ],
    ]);

    const cards = await buildQuantityProductCards(
      [quantityModel],
      qtyStock,
      storeMap,
      true,
      mockPricing,
    );

    expect(cards).toHaveLength(1);
    expect(cards[0].inStock).toBe(55);
    assertNoLeaks(cards, 'quantityCards');
  });

  it('buildUnitProductDetail strips sensitive unit, specs and supplier fields', async () => {
    const detail = await buildUnitProductDetail(
      contaminatedModel,
      contaminatedUnits,
      storeMap,
      true,
      mockPricing,
    );

    expect(detail.variants).toHaveLength(2);
    assertNoLeaks(detail, 'unitProductDetail');
  });

  it('buildQuantityProductDetail strips sensitive fields', async () => {
    const quantityModel: PublicModelRow & Record<string, unknown> = {
      id: 'model-qty-2',
      brand: 'Anker',
      name: 'PowerPort III 65W',
      kindCode: 'QUANTITY',
      categoryId: 'cat-acc-1',
      category: { id: 'cat-acc-1', name: 'Accessories' },
      imageFileName: 'charger.webp',
      salePrice: new Prisma.Decimal(45),
      acquisitionCost: new Prisma.Decimal(20),
    };
    const storeStock = new Map([['store-1', 12]]);

    const detail = await buildQuantityProductDetail(
      quantityModel,
      storeStock,
      storeMap,
      true,
      mockPricing,
    );

    expect(detail.inStock).toBe(12);
    assertNoLeaks(detail, 'quantityProductDetail');
  });

  it('config view mapper strips private settings and credentials', () => {
    const rawSettings = {
      id: 1,
      enabled: true,
      showPrices: true,
      contactPhone: '+998901234567',
      contactTelegram: '@malikashop',
      categoryIds: ['cat-1', 'cat-2'],
      telegramBotToken: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
      telegramChatId: '-1001234567890',
      databaseUrl: 'postgresql://user:password123@localhost:5432/db',
    };

    const publicConfig = {
      enabled: rawSettings.enabled,
      shopName: 'Malika',
      contactPhone: rawSettings.contactPhone,
      contactTelegram: rawSettings.contactTelegram,
      showPrices: rawSettings.showPrices,
      stores: [
        { id: 'store-1', name: 'Branch 1', address: 'Tashkent', phone: '123' },
      ],
      categories: [{ id: 'cat-1', name: 'Phones' }],
    };

    assertNoLeaks(publicConfig, 'publicConfig');
  });

  it('order public confirmation strips customer lists and internal IDs', () => {
    const publicOrderResult = {
      id: '20230000-0000-4000-8000-000000000001',
    };
    assertNoLeaks(publicOrderResult, 'orderResult');
  });
});
