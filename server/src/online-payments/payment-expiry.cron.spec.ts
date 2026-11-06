import { PaymentExpiryCron } from './payment-expiry.cron.js';

describe('PaymentExpiryCron', () => {
  it('cancels expired CREATED payments older than 12 hours', async () => {
    const mockRepo = {
      findExpiredPayments: jest
        .fn()
        .mockResolvedValue([
          { id: 'pay-1', providerCode: 'PAYME', orderId: 'ord-1' },
        ]),
      releaseDeviceForOrder: jest.fn(),
      updateOrderStatus: jest.fn(),
    } as any;

    const mockPayments = {
      cancelPayment: jest.fn().mockResolvedValue({}),
    } as any;

    const mockPrisma = {
      storefrontOrder: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb({})),
    } as any;

    const cron = new PaymentExpiryCron(mockRepo, mockPayments, mockPrisma);
    await cron.handleExpiration();

    expect(mockPayments.cancelPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: 'pay-1',
        providerCode: 'PAYME',
      }),
    );
  });
});
