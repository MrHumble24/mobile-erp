import type { OnlinePaymentPort } from '../online-payment.port.js';
import { PaymeProvider } from './payme.provider.js';

function mockPayment(status = 'CREATED', extra = {}) {
  return {
    id: 'pay-1',
    orderId: 'ord-123',
    providerCode: 'PAYME',
    statusCode: status,
    amount: '110000.00',
    providerTransId: 'payme-tx-1',
    providerPrepareId: null,
    rawPayload: {},
    reason: null,
    paidAt: status === 'PAID' ? new Date(1700000005000) : null,
    cancelledAt: status === 'CANCELLED' ? new Date(1700000010000) : null,
    refundedAt: status === 'REFUNDED' ? new Date(1700000010000) : null,
    createdAt: new Date(1700000000000),
    updatedAt: new Date(1700000000000),
    ...extra,
  };
}

describe('PaymeProvider (Merchant API)', () => {
  let provider: PaymeProvider;
  let port: jest.Mocked<OnlinePaymentPort>;
  const secret = 'test-merchant-key';
  const authHeader = `Basic ${Buffer.from(`Paycom:${secret}`).toString('base64')}`;

  const baseOrder = {
    id: 'ord-123',
    orderNumber: 'ord-123',
    storeId: 'store-1',
    modelId: 'mod-1',
    specs: {},
    paymentMethodCode: 'ONLINE',
    statusCode: 'NEW',
    priceSnapshot: '100000.00',
    deliveryFeeSnapshot: '10000.00',
    totalAmount: '110000.00',
    deviceId: null,
    saleId: null,
    hasStock: true,
  };

  beforeEach(() => {
    provider = new PaymeProvider();
    port = {
      findOrderForPayment: jest.fn().mockResolvedValue(baseOrder),
      startPayment: jest.fn().mockResolvedValue(mockPayment('CREATED')),
      markPaid: jest.fn().mockResolvedValue(mockPayment('PAID')),
      cancelPayment: jest
        .fn()
        .mockResolvedValue(mockPayment('CANCELLED', { reason: '1' })),
      findPayment: jest.fn().mockResolvedValue(null),
      listPaymentsForPeriod: jest.fn().mockResolvedValue([]),
    };
  });

  it('validates configuration and secret', async () => {
    await expect(provider.validate({}, secret)).rejects.toThrow();
    await expect(
      provider.validate({ merchantId: 'm1' }, null),
    ).rejects.toThrow();
    await expect(
      provider.validate({ merchantId: 'm1' }, secret),
    ).resolves.toBeUndefined();
  });

  it('builds checkout redirect URL', () => {
    const url = provider.checkoutUrl(
      {
        orderId: 'ord-123',
        amount: '110000.00',
        returnUrl: 'https://malika.uz/order',
      },
      { merchantId: 'm1', isTestMode: true },
    );
    expect(url).toContain('https://test.paycom.uz/');
    const base64 = url.split('/').pop()!;
    const decoded = Buffer.from(base64, 'base64').toString('utf8');
    expect(decoded).toContain('m=m1');
    expect(decoded).toContain('ac.order_id=ord-123');
    expect(decoded).toContain('a=11000000');
  });

  it('refuses on invalid or missing basic authorization header', async () => {
    const res = await provider.handleCallback(
      { headers: { authorization: 'Basic wrong' }, body: { id: 1 } },
      {},
      secret,
      port,
    );
    expect(res.body).toMatchObject({ error: { code: -32504 } });
  });

  it('refuses when password does not match secret', async () => {
    const badAuth = `Basic ${Buffer.from('Paycom:wrong-key').toString('base64')}`;
    const res = await provider.handleCallback(
      { headers: { authorization: badAuth }, body: { id: 1 } },
      {},
      secret,
      port,
    );
    expect(res.body).toMatchObject({ error: { code: -32504 } });
  });

  it('good run: CheckPerform -> Create -> Perform', async () => {
    const checkRes = await provider.handleCallback(
      {
        headers: { authorization: authHeader },
        body: {
          id: 10,
          method: 'CheckPerformTransaction',
          params: { amount: 11000000, account: { order_id: 'ord-123' } },
        },
      },
      {},
      secret,
      port,
    );
    expect(checkRes.body).toMatchObject({ result: { allow: true } });

    const createRes = await provider.handleCallback(
      {
        headers: { authorization: authHeader },
        body: {
          id: 11,
          method: 'CreateTransaction',
          params: {
            id: 'payme-tx-1',
            time: 1700000000000,
            amount: 11000000,
            account: { order_id: 'ord-123' },
          },
        },
      },
      {},
      secret,
      port,
    );
    expect(createRes.body).toMatchObject({
      result: { transaction: 'pay-1', state: 1 },
    });

    port.findPayment.mockResolvedValueOnce(mockPayment('CREATED'));
    const performRes = await provider.handleCallback(
      {
        headers: { authorization: authHeader },
        body: {
          id: 12,
          method: 'PerformTransaction',
          params: { id: 'payme-tx-1' },
        },
      },
      {},
      secret,
      port,
    );
    expect(performRes.body).toMatchObject({
      result: { transaction: 'pay-1', state: 2 },
    });
  });

  it('refuses with -32300 on incorrect amount', async () => {
    const res = await provider.handleCallback(
      {
        headers: { authorization: authHeader },
        body: {
          id: 1,
          method: 'CheckPerformTransaction',
          params: { amount: 5000, account: { order_id: 'ord-123' } },
        },
      },
      {},
      secret,
      port,
    );
    expect(res.body).toMatchObject({ error: { code: -32300, data: 'amount' } });
  });

  it('refuses with -31001 when order does not exist', async () => {
    port.findOrderForPayment.mockResolvedValueOnce(null);
    const res = await provider.handleCallback(
      {
        headers: { authorization: authHeader },
        body: {
          id: 1,
          method: 'CheckPerformTransaction',
          params: { amount: 11000000, account: { order_id: 'non-existent' } },
        },
      },
      {},
      secret,
      port,
    );
    expect(res.body).toMatchObject({
      error: { code: -31001, data: 'order_id' },
    });
  });

  it('refuses with -31007 when out of stock', async () => {
    port.findOrderForPayment.mockResolvedValueOnce({
      ...baseOrder,
      hasStock: false,
    });
    const res = await provider.handleCallback(
      {
        headers: { authorization: authHeader },
        body: {
          id: 1,
          method: 'CheckPerformTransaction',
          params: { amount: 11000000, account: { order_id: 'ord-123' } },
        },
      },
      {},
      secret,
      port,
    );
    expect(res.body).toMatchObject({ error: { code: -31007 } });
  });

  it('is idempotent: same CreateTransaction call returns existing state', async () => {
    port.findPayment.mockResolvedValueOnce(mockPayment('CREATED'));
    const res = await provider.handleCallback(
      {
        headers: { authorization: authHeader },
        body: {
          id: 15,
          method: 'CreateTransaction',
          params: {
            id: 'payme-tx-1',
            time: 1700000000000,
            amount: 11000000,
            account: { order_id: 'ord-123' },
          },
        },
      },
      {},
      secret,
      port,
    );
    expect(res.body).toMatchObject({
      result: { transaction: 'pay-1', state: 1 },
    });
  });

  it('cancels created transaction before paid (state -1)', async () => {
    port.findPayment.mockResolvedValueOnce(mockPayment('CREATED'));
    const res = await provider.handleCallback(
      {
        headers: { authorization: authHeader },
        body: {
          id: 20,
          method: 'CancelTransaction',
          params: { id: 'payme-tx-1', reason: 1 },
        },
      },
      {},
      secret,
      port,
    );
    expect(res.body).toMatchObject({
      result: { transaction: 'pay-1', state: -1 },
    });
  });

  it('refuses cancel after handover with -31008', async () => {
    port.findPayment.mockResolvedValueOnce(mockPayment('PAID'));
    port.cancelPayment.mockRejectedValueOnce(new Error('Order already sold'));
    const res = await provider.handleCallback(
      {
        headers: { authorization: authHeader },
        body: {
          id: 21,
          method: 'CancelTransaction',
          params: { id: 'payme-tx-1', reason: 2 },
        },
      },
      {},
      secret,
      port,
    );
    expect(res.body).toMatchObject({ error: { code: -31008 } });
  });
});
