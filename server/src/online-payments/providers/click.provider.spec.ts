import type { OnlinePaymentPort } from '../online-payment.port.js';
import { computeClickSign } from './click.errors.js';
import { ClickProvider } from './click.provider.js';

interface ClickReqParams {
  click_trans_id?: string | number;
  service_id?: string | number;
  merchant_trans_id?: string;
  merchant_prepare_id?: string | number;
  amount?: string | number;
  sign_time?: string;
  sign_string?: string;
  error?: number;
  error_note?: string;
  [key: string]: unknown;
}

function pRec(status = 'CREATED') {
  return {
    id: 'pay-1',
    orderId: 'ord-123',
    providerCode: 'CLICK',
    statusCode: status,
    amount: '110000.00',
  } as any;
}

describe('ClickProvider (Shop API)', () => {
  let provider: ClickProvider;
  let port: jest.Mocked<OnlinePaymentPort>;
  const secret = 'click-secret-key';
  const serviceId = '12345';
  const merchantId = '67890';

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

  function makeReq(action: number, params: ClickReqParams = {}) {
    const signTime = (params.sign_time as string) ?? '2026-11-07 00:00:00';
    const clickTransId = String(params.click_trans_id ?? '100');
    const sid = String(params.service_id ?? serviceId);
    const mid = String(params.merchant_trans_id ?? 'ord-123');
    const prepId = params.merchant_prepare_id
      ? String(params.merchant_prepare_id)
      : undefined;
    const amount = String(params.amount ?? '110000.00');

    const signString =
      (params.sign_string as string) ??
      computeClickSign(action, secret, {
        clickTransId,
        serviceId: sid,
        merchantTransId: mid,
        merchantPrepareId: prepId,
        amount,
        signTime,
      });

    return {
      headers: {},
      body: {
        click_trans_id: clickTransId,
        service_id: sid,
        merchant_trans_id: mid,
        amount,
        action,
        error: 0,
        sign_time: signTime,
        sign_string: signString,
        ...params,
      },
    };
  }

  beforeEach(() => {
    provider = new ClickProvider();
    port = {
      findOrderForPayment: jest.fn().mockResolvedValue(baseOrder),
      startPayment: jest.fn().mockResolvedValue(pRec('CREATED')),
      markPaid: jest.fn().mockResolvedValue(pRec('PAID')),
      cancelPayment: jest.fn().mockResolvedValue(pRec('CANCELLED')),
      findPayment: jest.fn().mockResolvedValue(null),
      listPaymentsForPeriod: jest.fn().mockResolvedValue([]),
    };
  });

  it('validates configuration and secret', async () => {
    await expect(provider.validate({}, secret)).rejects.toThrow();
    await expect(
      provider.validate({ serviceId: 's1' }, secret),
    ).rejects.toThrow();
    await expect(
      provider.validate({ serviceId: 's1', merchantId: 'm1' }, null),
    ).rejects.toThrow();
    await expect(
      provider.validate({ serviceId: 's1', merchantId: 'm1' }, secret),
    ).resolves.toBeUndefined();
  });

  it('builds checkout redirect URL', () => {
    const url = provider.checkoutUrl(
      {
        orderId: 'ord-123',
        amount: '110000.00',
        returnUrl: 'https://malika.uz/order',
      },
      { serviceId, merchantId },
    );
    expect(url).toContain('https://my.click.uz/services/pay');
    expect(url).toContain('service_id=12345');
    expect(url).toContain('merchant_id=67890');
    expect(url).toContain('amount=110000.00');
    expect(url).toContain('transaction_param=ord-123');
  });

  it('refuses with -1 on invalid MD5 sign_string', async () => {
    const req = makeReq(0, { sign_string: 'invalid-sign' });
    const res = await provider.handleCallback(req, {}, secret, port);
    expect(res.body).toMatchObject({
      error: -1,
      error_note: 'SIGN CHECK FAILED',
    });
  });

  it('good run: action 0 (Prepare) -> action 1 (Complete)', async () => {
    const prepRes = await provider.handleCallback(makeReq(0), {}, secret, port);
    expect(prepRes.body).toMatchObject({
      click_trans_id: 100,
      merchant_trans_id: 'ord-123',
      merchant_prepare_id: 'pay-1',
      error: 0,
    });

    port.findPayment.mockResolvedValueOnce(pRec('CREATED'));
    const compRes = await provider.handleCallback(
      makeReq(1, { merchant_prepare_id: 'pay-1' }),
      {},
      secret,
      port,
    );
    expect(compRes.body).toMatchObject({
      click_trans_id: 100,
      merchant_trans_id: 'ord-123',
      merchant_confirm_id: 'pay-1',
      error: 0,
    });
  });

  it('refuses with -2 on incorrect amount', async () => {
    const res = await provider.handleCallback(
      makeReq(0, { amount: '50000.00' }),
      {},
      secret,
      port,
    );
    expect(res.body).toMatchObject({
      error: -2,
      error_note: 'Incorrect parameter amount',
    });
  });

  it('refuses with -5 when order is not found', async () => {
    port.findOrderForPayment.mockResolvedValueOnce(null);
    const res = await provider.handleCallback(
      makeReq(0, { merchant_trans_id: 'non-existent' }),
      {},
      secret,
      port,
    );
    expect(res.body).toMatchObject({
      error: -5,
      error_note: 'User does not exist',
    });
  });

  it('cancels payment when Complete arrives with error < 0', async () => {
    port.findPayment.mockResolvedValueOnce(pRec('CREATED'));
    const res = await provider.handleCallback(
      makeReq(1, {
        merchant_prepare_id: 'pay-1',
        error: -5017,
        error_note: 'Insufficient funds',
      }),
      {},
      secret,
      port,
    );
    expect(res.body).toMatchObject({
      error: -9,
      error_note: 'Transaction cancelled',
    });
    expect(port.cancelPayment).toHaveBeenCalled();
  });

  it('is idempotent: duplicate Complete returns already paid with error 0', async () => {
    port.findPayment.mockResolvedValueOnce(pRec('PAID'));
    const res = await provider.handleCallback(
      makeReq(1, { merchant_prepare_id: 'pay-1', error: 0 }),
      {},
      secret,
      port,
    );
    expect(res.body).toMatchObject({ error: 0, error_note: 'Already paid' });
  });
});
