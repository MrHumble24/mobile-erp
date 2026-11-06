import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

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

describe('Storefront Public Routes Leak Test (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const createdOrderIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    await prisma.storefrontSettings.upsert({
      where: { id: 1 },
      create: { id: 1, enabled: true, showPrices: true },
      update: { enabled: true, showPrices: true },
    });
  });

  afterAll(async () => {
    try {
      if (createdOrderIds.length > 0) {
        await prisma.storefrontOrder.deleteMany({
          where: { id: { in: createdOrderIds } },
        });
      }
      await prisma.storefrontOrder.deleteMany({
        where: { customerName: 'Leak Test Customer' },
      });
    } finally {
      await app.close();
    }
  });

  it('GET /storefront/config contains no sensitive fields or 15-digit numbers', async () => {
    const res = await request(app.getHttpServer())
      .get('/storefront/config')
      .expect(200);

    assertNoLeaks(res.body, 'config');
  });

  it('GET /storefront/products contains no sensitive fields or 15-digit numbers', async () => {
    const res = await request(app.getHttpServer())
      .get('/storefront/products')
      .expect(200);

    assertNoLeaks(res.body, 'products');
  });

  it('GET /storefront/products/:modelId and POST /storefront/orders contain no sensitive data', async () => {
    const prodRes = await request(app.getHttpServer()).get(
      '/storefront/products',
    );
    const products = prodRes.body;

    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);

    const first = products[0];
    const detailRes = await request(app.getHttpServer())
      .get(`/storefront/products/${first.modelId}`)
      .expect(200);

    assertNoLeaks(detailRes.body, 'productDetail');

    const storeId = first.stores?.[0]?.id;
    expect(storeId).toBeDefined();

    const orderRes = await request(app.getHttpServer())
      .post('/storefront/orders')
      .send({
        name: 'Leak Test Customer',
        phone: '+998901234567',
        modelId: first.modelId,
        storeId,
        note: 'Testing security leak invariants',
      })
      .expect(201);

    const body = orderRes.body as { id?: string };
    if (typeof body?.id === 'string') {
      createdOrderIds.push(body.id);
    }
    assertNoLeaks(orderRes.body, 'orderResult');
  });
});
