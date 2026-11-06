import 'dotenv/config';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { Pool } from 'pg';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import type { AuthenticatedUser } from '../src/common/types/authenticated-user.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { SalesCreateService } from '../src/sales/sales-create.service.js';
import { StorefrontOrdersFulfillService } from '../src/storefront/storefront-orders-fulfill.service.js';
import { StorefrontOrdersService } from '../src/storefront/storefront-orders.service.js';
import { StorefrontPublicOrdersService } from '../src/storefront/storefront-public-orders.service.js';
import { runWithStoreSelection } from '../src/stores/lib/store-context.js';
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

describe('Online Shop Part 2: Delivery & Reservation (e2e)', () => {
  let admin: Pool;
  let dbName: string;
  let app: INestApplication;
  let prisma: PrismaService;
  let publicOrders: StorefrontPublicOrdersService;
  let orders: StorefrontOrdersService;
  let fulfill: StorefrontOrdersFulfillService;
  let salesCreate: SalesCreateService;
  let seed: Shop2SeedIds;
  let cashier: AuthenticatedUser;

  beforeAll(async () => {
    admin = new Pool({ connectionString: adminUrl() });
    dbName = randomName('shop2');
    const work = tmpdir();

    // Create DB & copy schema/seed
    await admin.query(`CREATE DATABASE "${dbName}"`);
    const dbUrl = new URL(adminUrl());
    dbUrl.pathname = `/${dbName}`;
    const url = dbUrl.toString();

    await copyFromSource(dbName, work);
    seed = await seedShop2Data(url);
    process.env.DATABASE_URL = url;

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = moduleRef.get(PrismaService);
    publicOrders = moduleRef.get(StorefrontPublicOrdersService);
    orders = moduleRef.get(StorefrontOrdersService);
    fulfill = moduleRef.get(StorefrontOrdersFulfillService);
    salesCreate = moduleRef.get(SalesCreateService);

    cashier = {
      id: seed.userId,
      email: 'cashier@test.com',
      permissions: new Set(['order.manage', 'sale.create']),
    };
  }, 30000);

  afterAll(async () => {
    if (app) await app.close();
    if (admin) {
      await dropDb(admin, dbName);
      await admin.end();
    }
  });

  it('1. pickup order -> confirm -> refused at till -> hand over', async () => {
    const o1 = await publicOrders.createOrder({
      name: 'Customer 1',
      phone: '+998901111111',
      modelId: seed.modelId,
      storeId: seed.storeId,
      fulfillmentMethod: 'PICKUP',
    });
    assert.ok(o1.id, 'order 1 created');

    const confirmed1 = await orders.updateStatus(
      seed.storeId,
      o1.id,
      seed.userId,
      { statusCode: 'CONTACTED' },
    );
    assert.equal(confirmed1.statusCode, 'CONTACTED');
    assert.ok(confirmed1.deviceId, 'order 1 holds a device');

    const heldDevice1 = await prisma.device.findUnique({
      where: { id: confirmed1.deviceId },
    });
    assert.equal(
      heldDevice1?.statusCode,
      'RESERVED',
      'held device is RESERVED',
    );

    // Refused at the till without storefrontOrderId
    await assert.rejects(
      runWithStoreSelection({ all: false, storeIds: [seed.storeId] }, () =>
        salesCreate.create(cashier, {
          imei: heldDevice1.imei!,
          salePrice: 1000,
          payments: [{ accountCode: 'CASH', amount: 1000 }],
        }),
      ),
      { name: 'ConflictException' },
      'refused at the till because device is RESERVED',
    );

    // Hand over
    const handedOver1 = await fulfill.handOver(seed.storeId, o1.id, cashier, {
      payments: [{ accountCode: 'CASH', amount: 1000 }],
    });
    assert.equal(handedOver1.statusCode, 'DONE');
    assert.ok(handedOver1.saleId, 'handover created sale');

    const soldDevice1 = await prisma.device.findUnique({
      where: { id: confirmed1.deviceId },
    });
    assert.equal(soldDevice1?.statusCode, 'SOLD', 'held device is SOLD');

    const saleRow1 = await prisma.sale.findUnique({
      where: { id: handedOver1.saleId },
    });
    assert.ok(saleRow1, 'sale exists');
  });

  it('2. delivery order with flat fee -> confirm -> SHIPPED -> hand over (fee row)', async () => {
    const o2 = await publicOrders.createOrder({
      name: 'Customer 2',
      phone: '+998902222222',
      modelId: seed.modelId,
      storeId: seed.storeId,
      fulfillmentMethod: 'DELIVERY',
      address: 'Amir Temur street 42',
    });
    const order2View = await publicOrders.getPublicOrder(o2.id);
    assert.equal(
      order2View.deliveryFeeSnapshot,
      '25000.00',
      'flat fee snapshot is 25000',
    );

    await orders.updateStatus(seed.storeId, o2.id, seed.userId, {
      statusCode: 'CONTACTED',
    });
    const shipped2 = await orders.updateStatus(
      seed.storeId,
      o2.id,
      seed.userId,
      { statusCode: 'SHIPPED' },
    );
    assert.equal(shipped2.statusCode, 'SHIPPED');

    const handedOver2 = await fulfill.handOver(seed.storeId, o2.id, cashier, {
      payments: [{ accountCode: 'CASH', amount: 1000 }],
      deliveryFeeAccountCode: 'CASH',
    });
    assert.equal(handedOver2.statusCode, 'DONE');

    const feeTx = await prisma.cashTransaction.findFirst({
      where: { orderId: o2.id, typeCode: 'DELIVERY_FEE' },
    });
    assert.ok(feeTx, 'delivery fee posted to ledger');
    assert.equal(
      feeTx?.amount.toString(),
      '25000',
      'fee amount matches snapshot',
    );
  });

  it('3. cancel a confirmed order (unit back IN_STOCK)', async () => {
    const o3 = await publicOrders.createOrder({
      name: 'Customer 3',
      phone: '+998903333333',
      modelId: seed.modelId,
      storeId: seed.storeId,
      fulfillmentMethod: 'PICKUP',
    });
    const confirmed3 = await orders.updateStatus(
      seed.storeId,
      o3.id,
      seed.userId,
      { statusCode: 'CONTACTED' },
    );
    const heldDev3Id = confirmed3.deviceId!;
    const dev3Before = await prisma.device.findUnique({
      where: { id: heldDev3Id },
    });
    assert.equal(dev3Before?.statusCode, 'RESERVED');

    const cancelled3 = await orders.updateStatus(
      seed.storeId,
      o3.id,
      seed.userId,
      { statusCode: 'CANCELLED' },
    );
    assert.equal(cancelled3.statusCode, 'CANCELLED');
    assert.equal(cancelled3.deviceId, null);

    const dev3After = await prisma.device.findUnique({
      where: { id: heldDev3Id },
    });
    assert.equal(
      dev3After?.statusCode,
      'IN_STOCK',
      'cancelled order releases device back to IN_STOCK',
    );
  });

  it('4. two confirms racing for the last unit', async () => {
    const o4A = await publicOrders.createOrder({
      name: 'Race Customer A',
      phone: '+998904444441',
      modelId: seed.raceModelId,
      storeId: seed.storeId,
      fulfillmentMethod: 'PICKUP',
    });
    const o4B = await publicOrders.createOrder({
      name: 'Race Customer B',
      phone: '+998904444442',
      modelId: seed.raceModelId,
      storeId: seed.storeId,
      fulfillmentMethod: 'PICKUP',
    });

    const win = await orders.updateStatus(seed.storeId, o4A.id, seed.userId, {
      statusCode: 'CONTACTED',
    });
    assert.equal(win.statusCode, 'CONTACTED');
    assert.equal(win.deviceId, seed.devRaceId);

    await assert.rejects(
      orders.updateStatus(seed.storeId, o4B.id, seed.userId, {
        statusCode: 'CONTACTED',
      }),
      { name: 'ConflictException' },
      'second confirm fails with 409 ConflictException when stock exhausted',
    );

    const orderBCheck = await prisma.storefrontOrder.findUnique({
      where: { id: o4B.id },
    });
    assert.equal(orderBCheck?.statusCode, 'NEW', 'losing order remains NEW');
    assert.equal(
      orderBCheck?.deviceId,
      null,
      'losing order does not hold device',
    );
  });
});
