import { BadRequestException } from '@nestjs/common';
import { CompanyService } from '../company/company.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SecretsService } from '../secrets/secrets.service.js';
import { OnlinePaymentsConfigService } from './online-payments-config.service.js';
import { OnlinePaymentsRepository } from './online-payments.repository.js';
import { OnlinePaymentsService } from './online-payments.service.js';
import { ProviderRegistry } from './providers/provider.registry.js';

describe('OnlinePaymentsService', () => {
  let service: OnlinePaymentsService;
  let repo: jest.Mocked<OnlinePaymentsRepository>;
  let prisma: jest.Mocked<PrismaService>;
  let secrets: jest.Mocked<SecretsService>;
  let registry: jest.Mocked<ProviderRegistry>;
  let company: jest.Mocked<CompanyService>;

  const mockOrder = {
    id: 'ord-1',
    orderNumber: 'ord-1',
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

  const mockPayment = {
    id: 'pay-1',
    orderId: 'ord-1',
    providerCode: 'PAYME',
    statusCode: 'CREATED',
    amount: '110000.00',
    providerTransId: 'tx-1',
    providerPrepareId: null,
    rawPayload: {},
    reason: null,
    paidAt: null,
    cancelledAt: null,
    refundedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repo = {
      listConfigs: jest.fn(),
      getConfig: jest.fn(),
      upsertConfig: jest.fn(),
      lockOrder: jest.fn(),
      findOrderForPayment: jest.fn().mockResolvedValue(mockOrder),
      holdDeviceForOrder: jest.fn().mockResolvedValue('dev-1'),
      releaseDeviceForOrder: jest.fn(),
      updateOrderStatus: jest.fn(),
      findPaymentById: jest.fn().mockResolvedValue(mockPayment),
      findPaymentByProviderTransId: jest.fn().mockResolvedValue(null),
      findActivePaymentForOrder: jest.fn().mockResolvedValue(null),
      createPayment: jest.fn().mockResolvedValue(mockPayment),
      updatePayment: jest.fn().mockResolvedValue(mockPayment),
      listPaymentsForPeriod: jest.fn(),
      findExpiredPayments: jest.fn(),
    } as any;

    prisma = {
      $transaction: jest.fn((cb: (tx: unknown) => unknown) =>
        cb({
          storefrontOrder: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'ord-1',
              model: { kindCode: 'SERIAL' },
            }),
          },
        }),
      ),
    } as any;

    secrets = {
      state: jest.fn().mockResolvedValue('set'),
      read: jest.fn().mockResolvedValue('key123'),
      set: jest.fn(),
    } as any;

    registry = {
      has: jest.fn().mockReturnValue(true),
      get: jest.fn().mockReturnValue({ validate: jest.fn() }),
    } as any;

    company = {
      getCurrency: jest.fn().mockResolvedValue({ code: 'UZS', sign: 'soʻm' }),
    } as any;

    const configService = new OnlinePaymentsConfigService(
      repo,
      secrets,
      registry,
      company,
    );
    service = new OnlinePaymentsService(repo, prisma, configService);
  });

  describe('saveConfig', () => {
    it('refuses to enable online payment if company currency is not UZS', async () => {
      company.getCurrency.mockResolvedValueOnce({
        code: 'USD',
        sign: '$',
      } as any);
      await expect(
        service.saveConfig('PAYME', { isEnabled: true }),
      ).rejects.toThrow(BadRequestException);
    });

    it('persists configuration when valid', async () => {
      repo.getConfig.mockResolvedValueOnce({
        id: 'c1',
        providerCode: 'PAYME',
        provider: {
          code: 'PAYME',
          label: 'Payme',
          sortOrder: 1,
          isActive: true,
        },
        isEnabled: true,
        isTestMode: true,
        allowedIps: null,
        settings: { merchantId: 'm1' },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const res = await service.saveConfig('PAYME', {
        isEnabled: true,
        settings: { merchantId: 'm1' },
      });
      expect(repo.upsertConfig).toHaveBeenCalledWith('PAYME', {
        isEnabled: true,
        settings: { merchantId: 'm1' },
      });
      expect(res.providerCode).toBe('PAYME');
    });
  });

  describe('refundPayment', () => {
    it('refuses to refund payment that is not in REFUND_DUE state', async () => {
      repo.findPaymentById.mockResolvedValueOnce({
        ...mockPayment,
        statusCode: 'PAID',
      });
      await expect(service.refundPayment('pay-1', 'reason')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('marks REFUND_DUE payment as REFUNDED', async () => {
      repo.findPaymentById.mockResolvedValueOnce({
        ...mockPayment,
        statusCode: 'REFUND_DUE',
      });
      repo.updatePayment.mockResolvedValueOnce({
        ...mockPayment,
        statusCode: 'REFUNDED',
        refundedAt: new Date(),
      });

      const res = await service.refundPayment('pay-1', 'Refund processed');
      expect(res.statusCode).toBe('REFUNDED');
      expect(repo.updatePayment).toHaveBeenCalledWith(
        'pay-1',
        expect.objectContaining({
          status: { connect: { code: 'REFUNDED' } },
        }),
      );
    });
  });

  describe('startPayment', () => {
    it('holds in-stock serial device when starting online payment', async () => {
      const p = await service.startPayment({
        orderId: 'ord-1',
        providerCode: 'PAYME',
        amount: '110000.00',
        providerTransId: 'tx-1',
      });
      expect(repo.lockOrder).toHaveBeenCalledWith('ord-1', expect.anything());
      expect(repo.holdDeviceForOrder).toHaveBeenCalled();
      expect(p.statusCode).toBe('CREATED');
    });

    it('refuses when payment amount does not match order total', async () => {
      await expect(
        service.startPayment({
          orderId: 'ord-1',
          providerCode: 'PAYME',
          amount: '50000.00',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('is idempotent when same providerTransId already exists', async () => {
      repo.findPaymentByProviderTransId.mockResolvedValueOnce(mockPayment);
      const p = await service.startPayment({
        orderId: 'ord-1',
        providerCode: 'PAYME',
        amount: '110000.00',
        providerTransId: 'tx-1',
      });
      expect(p.id).toBe('pay-1');
      expect(repo.createPayment).not.toHaveBeenCalled();
    });
  });

  describe('markPaid', () => {
    it('transitions payment to PAID', async () => {
      repo.updatePayment.mockResolvedValueOnce({
        ...mockPayment,
        statusCode: 'PAID',
        paidAt: new Date(),
      });

      const p = await service.markPaid({
        paymentId: 'pay-1',
        providerCode: 'PAYME',
      });
      expect(p.statusCode).toBe('PAID');
    });
  });

  describe('cancelPayment', () => {
    it('releases held device and cancels order when CREATED payment is cancelled', async () => {
      (prisma.$transaction as jest.Mock).mockImplementationOnce(
        (cb: (tx: unknown) => unknown) => {
          return cb({
            storefrontOrder: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'ord-1',
                statusCode: 'NEW',
                deviceId: 'dev-1',
                saleId: null,
              }),
            },
          });
        },
      );
      repo.updatePayment.mockResolvedValueOnce({
        ...mockPayment,
        statusCode: 'CANCELLED',
      });

      const p = await service.cancelPayment({
        paymentId: 'pay-1',
        providerCode: 'PAYME',
      });
      expect(repo.releaseDeviceForOrder).toHaveBeenCalled();
      expect(repo.updateOrderStatus).toHaveBeenCalledWith(
        'ord-1',
        'NEW',
        'CANCELLED',
        expect.any(String),
        expect.anything(),
      );
      expect(p.statusCode).toBe('CANCELLED');
    });

    it('refuses cancel if order is already sold (hand-over complete)', async () => {
      (prisma.$transaction as jest.Mock).mockImplementationOnce(
        (cb: (tx: unknown) => unknown) => {
          return cb({
            storefrontOrder: {
              findUnique: jest.fn().mockResolvedValue({
                id: 'ord-1',
                statusCode: 'DONE',
                saleId: 'sale-99',
              }),
            },
          });
        },
      );
      await expect(
        service.cancelPayment({ paymentId: 'pay-1', providerCode: 'PAYME' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
