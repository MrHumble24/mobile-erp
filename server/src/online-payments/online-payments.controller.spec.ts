import { OnlinePaymentsController } from './online-payments.controller.js';
import { OnlinePaymentsRepository } from './online-payments.repository.js';
import { OnlinePaymentsService } from './online-payments.service.js';
import { ProviderRegistry } from './providers/provider.registry.js';
import { SecretsService } from '../secrets/secrets.service.js';

describe('OnlinePaymentsController', () => {
  let controller: OnlinePaymentsController;
  let service: jest.Mocked<OnlinePaymentsService>;
  let repo: jest.Mocked<OnlinePaymentsRepository>;
  let registry: jest.Mocked<ProviderRegistry>;
  let secrets: jest.Mocked<SecretsService>;
  let mockAdapter: any;

  beforeEach(() => {
    service = {
      listConfigs: jest.fn().mockResolvedValue([]),
      getConfig: jest.fn(),
      saveConfig: jest.fn(),
      setSecret: jest.fn(),
      checkProvider: jest
        .fn()
        .mockResolvedValue({ ok: true, message: 'valid' }),
      refundPayment: jest.fn(),
    } as any;

    repo = {
      getConfig: jest.fn().mockResolvedValue({
        providerCode: 'PAYME',
        isEnabled: true,
        isTestMode: true,
        allowedIps: null,
        settings: {},
      }),
    } as any;

    mockAdapter = {
      handleCallback: jest.fn().mockResolvedValue({
        statusCode: 200,
        body: { result: { allow: true } },
      }),
    };

    registry = {
      has: jest.fn().mockReturnValue(true),
      get: jest.fn().mockReturnValue(mockAdapter),
    } as any;

    secrets = {
      read: jest.fn().mockResolvedValue('test-key'),
    } as any;

    controller = new OnlinePaymentsController(service, repo, registry, secrets);
  });

  it('delegates to adapter on allowed callback', async () => {
    const req = {
      headers: { authorization: 'Basic 123' },
      body: { id: 1, method: 'CheckPerformTransaction' },
      ip: '127.0.0.1',
      socket: {},
    } as any;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
    } as any;

    await controller.handleCallback('payme', req, res);
    expect(mockAdapter.handleCallback).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ result: { allow: true } });
  });

  it('refuses callback when provider is disabled', async () => {
    repo.getConfig.mockResolvedValueOnce({
      providerCode: 'PAYME',
      isEnabled: false,
    } as any);

    const req = {
      headers: {},
      body: { id: 1 },
      ip: '127.0.0.1',
      socket: {},
    } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

    await controller.handleCallback('payme', req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: -32504 }),
      }),
    );
  });

  it('refuses callback when caller IP is not in allowedIps list', async () => {
    repo.getConfig.mockResolvedValueOnce({
      providerCode: 'PAYME',
      isEnabled: true,
      allowedIps: ['10.0.0.1'],
      settings: {},
    } as any);

    const req = {
      headers: {},
      body: { id: 1 },
      ip: '192.168.1.1',
      socket: {},
    } as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

    await controller.handleCallback('payme', req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: -32504 }),
      }),
    );
  });
});
