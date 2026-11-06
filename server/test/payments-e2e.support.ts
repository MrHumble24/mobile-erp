import { tmpdir } from 'node:os';
import { Pool } from 'pg';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import type { AuthenticatedUser } from '../src/common/types/authenticated-user.js';
import { OnlinePaymentsService } from '../src/online-payments/online-payments.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { SecretsService } from '../src/secrets/secrets.service.js';
import { StorefrontOrdersFulfillService } from '../src/storefront/storefront-orders-fulfill.service.js';
import { StorefrontOrdersService } from '../src/storefront/storefront-orders.service.js';
import { StorefrontPublicOrdersService } from '../src/storefront/storefront-public-orders.service.js';
import {
  adminUrl,
  copyFromSource,
  dropDb,
  randomName,
} from '../scripts/lib/e2e-support.js';
import {
  seedShop2Data,
  type Shop2SeedIds,
} from '../scripts/lib/shop2-e2e-seed.js';

export interface PaymentTestEnv {
  admin: Pool;
  dbName: string;
  app: INestApplication;
  prisma: PrismaService;
  publicOrders: StorefrontPublicOrdersService;
  fulfill: StorefrontOrdersFulfillService;
  orders: StorefrontOrdersService;
  paymentsService: OnlinePaymentsService;
  secrets: SecretsService;
  seed: Shop2SeedIds;
  cashier: AuthenticatedUser;
  paymeAuth: string;
  clickSecret: string;
  clickServiceId: string;
}

export async function setupPaymentTestEnv(): Promise<PaymentTestEnv> {
  const admin = new Pool({ connectionString: adminUrl() });
  const dbName = randomName('paye2e');
  const work = tmpdir();

  await admin.query(`CREATE DATABASE "${dbName}"`);
  const dbUrl = new URL(adminUrl());
  dbUrl.pathname = `/${dbName}`;
  const url = dbUrl.toString();

  await copyFromSource(dbName, work);
  const seed = await seedShop2Data(url);
  process.env.DATABASE_URL = url;

  // Set company currency to UZS for online payments
  const client = new Pool({ connectionString: url });
  await client.query(
    `UPDATE company_profiles SET "currencyCode" = 'UZS' WHERE id = 'default'`,
  );
  await client.end();

  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const prisma = moduleRef.get(PrismaService);
  const publicOrders = moduleRef.get(StorefrontPublicOrdersService);
  const fulfill = moduleRef.get(StorefrontOrdersFulfillService);
  const orders = moduleRef.get(StorefrontOrdersService);
  const paymentsService = moduleRef.get(OnlinePaymentsService);
  const secrets = moduleRef.get(SecretsService);

  const cashier: AuthenticatedUser = {
    id: seed.userId,
    email: 'cashier@test.com',
    permissions: new Set([
      'order.manage',
      'sale.create',
      'settings.manage',
      'payment.refund',
    ]),
  };

  const paymeSecret = 'test-payme-secret-key';
  const paymeAuth = `Basic ${Buffer.from(`Paycom:${paymeSecret}`).toString('base64')}`;
  const clickSecret = 'test-click-secret-key';
  const clickServiceId = '12345';

  await secrets.set('payment.payme.key', paymeSecret);
  await secrets.set('payment.click.key', clickSecret);
  await paymentsService.saveConfig('PAYME', {
    isEnabled: true,
    isTestMode: true,
    settings: { merchantId: 'payme-merch-1' },
  });
  await paymentsService.saveConfig('CLICK', {
    isEnabled: true,
    isTestMode: true,
    settings: { serviceId: clickServiceId, merchantId: 'click-merch-1' },
  });

  return {
    admin,
    dbName,
    app,
    prisma,
    publicOrders,
    fulfill,
    orders,
    paymentsService,
    secrets,
    seed,
    cashier,
    paymeAuth,
    clickSecret,
    clickServiceId,
  };
}

export async function teardownPaymentTestEnv(
  env: PaymentTestEnv,
): Promise<void> {
  if (env.app) await env.app.close();
  if (env.admin) {
    await dropDb(env.admin, env.dbName);
    await env.admin.end();
  }
}
