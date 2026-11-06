import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../app.module.js';
import { PrismaService } from '../prisma/prisma.service.js';

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

describe('Storefront Public Routes Leak Test', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

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

    // Turn storefront on for testing
    await prisma.storefrontSettings.upsert({
      where: { id: 1 },
      create: { id: 1, enabled: true, showPrices: true },
      update: { enabled: true, showPrices: true },
    });
  });

  afterAll(async () => {
    await app.close();
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
    // Check if there is an in-stock product from /storefront/products
    const prodRes = await request(app.getHttpServer()).get(
      '/storefront/products',
    );
    const products = prodRes.body;

    if (Array.isArray(products) && products.length > 0) {
      const first = products[0];
      const detailRes = await request(app.getHttpServer())
        .get(`/storefront/products/${first.modelId}`)
        .expect(200);

      assertNoLeaks(detailRes.body, 'productDetail');

      const storeId = first.stores?.[0]?.id;
      if (storeId) {
        const orderRes = await request(app.getHttpServer())
          .post('/storefront/orders')
          .send({
            name: 'Leak Test Customer',
            phone: '+998901234567',
            modelId: first.modelId,
            storeId,
            note: 'Testing security leak invariants',
          });

        if (orderRes.status !== 201) {
          console.error(
            'Order creation failed:',
            orderRes.status,
            orderRes.body,
          );
        }
        expect(orderRes.status).toBe(201);
        assertNoLeaks(orderRes.body, 'orderResult');
      }
    }
  });
});
