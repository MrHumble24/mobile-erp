import 'dotenv/config';
import assert from 'node:assert/strict';
import request from 'supertest';
import { computeClickSign } from '../src/online-payments/providers/click.errors.js';
import {
  type PaymentTestEnv,
  setupPaymentTestEnv,
  teardownPaymentTestEnv,
} from './payments-e2e.support.js';

describe('Online Payments (Payme & Click) e2e', () => {
  let env: PaymentTestEnv;

  beforeAll(async () => {
    env = await setupPaymentTestEnv();
  }, 45000);

  afterAll(async () => {
    if (env) await teardownPaymentTestEnv(env);
  });

  it('1. Payme flow: callback -> device hold -> mark paid -> hand-over on PAYME ledger account', async () => {
    const { id: orderId } = await env.publicOrders.createOrder({
      modelId: env.seed.modelId,
      storeId: env.seed.storeId,
      name: 'Payme Buyer',
      phone: '+998901112233',
      fulfillmentMethod: 'DELIVERY',
      address: 'Tashkent, Chorsu 5',
      paymentMethod: 'ONLINE',
    });

    const orderBefore = await env.prisma.storefrontOrder.findUniqueOrThrow({
      where: { id: orderId },
    });
    assert.equal(orderBefore.deviceId, null);
    const totalAmount =
      Number(orderBefore.priceSnapshot) +
      Number(orderBefore.deliveryFeeSnapshot);
    const tiyin = totalAmount * 100;

    const checkRes = await request(env.app.getHttpServer())
      .post('/online-payments/callback/payme')
      .set('Authorization', env.paymeAuth)
      .send({
        id: 101,
        method: 'CheckPerformTransaction',
        params: { amount: tiyin, account: { order_id: orderId } },
      });
    assert.equal(checkRes.status, 200);
    assert.equal(checkRes.body.result?.allow, true);

    const createRes = await request(env.app.getHttpServer())
      .post('/online-payments/callback/payme')
      .set('Authorization', env.paymeAuth)
      .send({
        id: 102,
        method: 'CreateTransaction',
        params: {
          id: 'pme-tx-1',
          time: Date.now(),
          amount: tiyin,
          account: { order_id: orderId },
        },
      });
    assert.equal(createRes.status, 200);
    assert.equal(createRes.body.result?.state, 1);

    const orderHeld = await env.prisma.storefrontOrder.findUniqueOrThrow({
      where: { id: orderId },
    });
    assert.ok(orderHeld.deviceId);
    const heldDevice = await env.prisma.device.findUniqueOrThrow({
      where: { id: orderHeld.deviceId },
    });
    assert.equal(heldDevice.statusCode, 'RESERVED');

    const performRes = await request(env.app.getHttpServer())
      .post('/online-payments/callback/payme')
      .set('Authorization', env.paymeAuth)
      .send({
        id: 103,
        method: 'PerformTransaction',
        params: { id: 'pme-tx-1' },
      });
    assert.equal(performRes.status, 200);
    assert.equal(performRes.body.result?.state, 2);

    const paymentRow = await env.prisma.onlinePayment.findFirstOrThrow({
      where: { orderId },
    });
    assert.equal(paymentRow.statusCode, 'PAID');

    await env.orders.updateStatus(env.seed.storeId, orderId, env.cashier.id, {
      statusCode: 'CONTACTED',
    });
    await env.orders.updateStatus(env.seed.storeId, orderId, env.cashier.id, {
      statusCode: 'SHIPPED',
    });

    await assert.rejects(
      () =>
        env.fulfill.handOver(env.seed.storeId, orderId, env.cashier, {
          payments: [
            { accountCode: 'CASH', amount: Number(orderHeld.priceSnapshot) },
          ],
          deliveryFeeAccountCode: 'CASH',
        }),
      (err: any) => err.response?.code === 'PAYMENT_ACCOUNT_MISMATCH',
    );

    const done = await env.fulfill.handOver(
      env.seed.storeId,
      orderId,
      env.cashier,
      {
        payments: [
          { accountCode: 'PAYME', amount: Number(orderHeld.priceSnapshot) },
        ],
        deliveryFeeAccountCode: 'PAYME',
      },
    );
    assert.equal(done.statusCode, 'DONE');

    const finalDevice = await env.prisma.device.findUniqueOrThrow({
      where: { id: orderHeld.deviceId },
    });
    assert.equal(finalDevice.statusCode, 'SOLD');

    const saleTx = await env.prisma.cashTransaction.findFirstOrThrow({
      where: { saleId: done.saleId!, typeCode: 'SALE' },
    });
    assert.equal(saleTx.accountCode, 'PAYME');
    assert.equal(Number(saleTx.amount), Number(orderHeld.priceSnapshot));

    const feeTx = await env.prisma.cashTransaction.findFirstOrThrow({
      where: { orderId, typeCode: 'DELIVERY_FEE' },
    });
    assert.equal(feeTx.accountCode, 'PAYME');
    assert.equal(Number(feeTx.amount), Number(orderHeld.deliveryFeeSnapshot));
  });

  it('2. Click flow: Prepare -> device hold -> Complete -> hand-over on CLICK account', async () => {
    const { id: orderId } = await env.publicOrders.createOrder({
      modelId: env.seed.modelId,
      storeId: env.seed.storeId,
      name: 'Click Buyer',
      phone: '+998905556677',
      fulfillmentMethod: 'PICKUP',
      paymentMethod: 'ONLINE',
    });

    const order = await env.prisma.storefrontOrder.findUniqueOrThrow({
      where: { id: orderId },
    });
    const amount = Number(order.priceSnapshot).toFixed(2);
    const signTime = '2026-11-07 12:00:00';

    const sign0 = computeClickSign(0, env.clickSecret, {
      clickTransId: '9001',
      serviceId: env.clickServiceId,
      merchantTransId: orderId,
      amount,
      signTime,
    });

    const prepRes = await request(env.app.getHttpServer())
      .post('/online-payments/callback/click')
      .send({
        click_trans_id: '9001',
        service_id: env.clickServiceId,
        merchant_trans_id: orderId,
        amount,
        action: 0,
        error: 0,
        sign_time: signTime,
        sign_string: sign0,
      });
    assert.equal(prepRes.body.error, 0);
    const prepId = prepRes.body.merchant_prepare_id;
    assert.ok(prepId);

    const sign1 = computeClickSign(1, env.clickSecret, {
      clickTransId: '9001',
      serviceId: env.clickServiceId,
      merchantTransId: orderId,
      merchantPrepareId: prepId,
      amount,
      signTime,
    });

    const compRes = await request(env.app.getHttpServer())
      .post('/online-payments/callback/click')
      .send({
        click_trans_id: '9001',
        service_id: env.clickServiceId,
        merchant_trans_id: orderId,
        merchant_prepare_id: prepId,
        amount,
        action: 1,
        error: 0,
        sign_time: signTime,
        sign_string: sign1,
      });
    assert.equal(compRes.body.error, 0);

    const payment = await env.prisma.onlinePayment.findFirstOrThrow({
      where: { orderId },
    });
    assert.equal(payment.statusCode, 'PAID');

    await env.orders.updateStatus(env.seed.storeId, orderId, env.cashier.id, {
      statusCode: 'CONTACTED',
    });
    const done = await env.fulfill.handOver(
      env.seed.storeId,
      orderId,
      env.cashier,
      {
        payments: [
          { accountCode: 'CLICK', amount: Number(order.priceSnapshot) },
        ],
      },
    );
    assert.equal(done.statusCode, 'DONE');

    const saleTx = await env.prisma.cashTransaction.findFirstOrThrow({
      where: { saleId: done.saleId!, typeCode: 'SALE' },
    });
    assert.equal(saleTx.accountCode, 'CLICK');
    assert.equal(Number(saleTx.amount), Number(order.priceSnapshot));
  });

  it('3. Cancel paid order -> REFUND_DUE -> manual refund to REFUNDED', async () => {
    const { id: orderId } = await env.publicOrders.createOrder({
      modelId: env.seed.modelId,
      storeId: env.seed.storeId,
      name: 'Cancel Buyer',
      phone: '+998909998877',
      fulfillmentMethod: 'PICKUP',
      paymentMethod: 'ONLINE',
    });

    const order = await env.prisma.storefrontOrder.findUniqueOrThrow({
      where: { id: orderId },
    });
    const tiyin = Number(order.priceSnapshot) * 100;

    await request(env.app.getHttpServer())
      .post('/online-payments/callback/payme')
      .set('Authorization', env.paymeAuth)
      .send({
        id: 201,
        method: 'CreateTransaction',
        params: {
          id: 'pme-cancel-tx',
          time: Date.now(),
          amount: tiyin,
          account: { order_id: orderId },
        },
      });

    await request(env.app.getHttpServer())
      .post('/online-payments/callback/payme')
      .set('Authorization', env.paymeAuth)
      .send({
        id: 202,
        method: 'PerformTransaction',
        params: { id: 'pme-cancel-tx' },
      });

    await env.orders.updateStatus(env.seed.storeId, orderId, env.cashier.id, {
      statusCode: 'CANCELLED',
    });

    const payment = await env.prisma.onlinePayment.findFirstOrThrow({
      where: { orderId },
    });
    assert.equal(payment.statusCode, 'REFUND_DUE');

    const refunded = await env.paymentsService.refundPayment(
      payment.id,
      'Customer cancellation request',
    );
    assert.equal(refunded.statusCode, 'REFUNDED');
    assert.ok(refunded.refundedAt);
  });
});
