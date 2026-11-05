import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../generated/client/client.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { StoresService } from '../stores/stores.service.js';
import { PartnersRepository } from './partners.repository.js';
import { PartnersService } from './partners.service.js';

const D = (n: number | string) => new Prisma.Decimal(n);
const caller: AuthenticatedUser = {
  id: 'u1',
  email: 'c@x',
  permissions: new Set(),
};

function build(overrides: Partial<Record<string, jest.Mock>> = {}) {
  const repo = {
    getCreditStatus: jest.fn(),
    findWithBalance: jest.fn().mockResolvedValue({ id: 'p1' }),
    consignmentBelongsTo: jest.fn().mockResolvedValue(true),
    createPayment: jest.fn().mockResolvedValue({ id: 'pay1' }),
    ...overrides,
  };
  const stores = { currentStoreId: jest.fn().mockResolvedValue('store-1') };
  const events = { emit: jest.fn() };
  const service = new PartnersService(
    repo as unknown as PartnersRepository,
    stores as unknown as StoresService,
    events as unknown as EventEmitter2,
  );
  return { service, repo, stores, events };
}

describe('PartnersService.assertWithinCreditLimit', () => {
  it('rejects when outstanding + price exceeds a non-zero limit', async () => {
    const { service } = build({
      getCreditStatus: jest
        .fn()
        .mockResolvedValue({ creditLimit: D(1000), outstanding: D(800) }),
    });
    await expect(service.assertWithinCreditLimit('p1', D(300))).rejects.toThrow(
      ConflictException,
    );
  });

  it('allows when projected balance is within the limit', async () => {
    const { service } = build({
      getCreditStatus: jest
        .fn()
        .mockResolvedValue({ creditLimit: D(1000), outstanding: D(800) }),
    });
    await expect(
      service.assertWithinCreditLimit('p1', D(200)),
    ).resolves.toBeUndefined();
  });

  it('treats creditLimit 0 as unlimited', async () => {
    const { service } = build({
      getCreditStatus: jest
        .fn()
        .mockResolvedValue({ creditLimit: D(0), outstanding: D(9999) }),
    });
    await expect(
      service.assertWithinCreditLimit('p1', D(5000)),
    ).resolves.toBeUndefined();
  });

  it('404s when the partner does not exist', async () => {
    const { service } = build({
      getCreditStatus: jest.fn().mockResolvedValue(null),
    });
    await expect(service.assertWithinCreditLimit('p1', D(1))).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('PartnersService.recordPayment', () => {
  it('rejects a consignment that belongs to another partner', async () => {
    const { service, repo } = build({
      consignmentBelongsTo: jest.fn().mockResolvedValue(false),
    });
    await expect(
      service.recordPayment(caller, 'p1', { amount: 50, consignmentId: 'c9' }),
    ).rejects.toThrow(BadRequestException);
    expect(repo.createPayment).not.toHaveBeenCalled();
  });

  it('stamps the receiving user and records the payment', async () => {
    const { service, repo } = build();
    await service.recordPayment(caller, 'p1', { amount: 50 });
    expect(repo.createPayment).toHaveBeenCalledWith(
      expect.objectContaining({ partnerId: 'p1', receivedById: 'u1' }),
    );
  });
});
