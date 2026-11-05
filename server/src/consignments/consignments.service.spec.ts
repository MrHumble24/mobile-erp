import { ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../generated/client/client.js';
import { DevicesService } from '../devices/devices.service.js';
import { PartnersService } from '../partners/partners.service.js';
import { PricingService } from '../pricing/pricing.service.js';
import { StoresService } from '../stores/stores.service.js';
import type { AuthenticatedUser } from '../common/types/authenticated-user.js';
import { ConsignmentsRepository } from './consignments.repository.js';
import { ConsignmentsService } from './consignments.service.js';
import { ConsignmentsWriteRepository } from './consignments.write.repository.js';

const caller: AuthenticatedUser = {
  id: 'u1',
  email: 'c@x',
  permissions: new Set(),
};

function build() {
  const reads = { findByClientMutationId: jest.fn().mockResolvedValue(null) };
  const writes = {
    createTransfer: jest.fn().mockResolvedValue({
      id: 'c1',
      imei: '123456789012345',
      agreedPrice: 500,
      dueDate: new Date('2026-12-01T00:00:00.000Z'),
    }),
  };
  const partners = {
    assertWithinCreditLimit: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue({ shopName: 'Shop A' }),
  };
  const stores = { currentStoreId: jest.fn().mockResolvedValue('store-1') };
  const devices = {
    findByCode: jest.fn().mockResolvedValue(null),
  };
  const pricing = {
    listPriceForUnit: jest.fn().mockResolvedValue(null),
  };
  const events = { emit: jest.fn() };
  const service = new ConsignmentsService(
    reads as unknown as ConsignmentsRepository,
    writes as unknown as ConsignmentsWriteRepository,
    partners as unknown as PartnersService,
    stores as unknown as StoresService,
    devices as unknown as DevicesService,
    pricing as unknown as PricingService,
    events as unknown as EventEmitter2,
  );
  return { service, reads, writes, partners, stores, devices, pricing, events };
}

const dto = {
  imei: '123456789012345',
  partnerId: '11111111-1111-1111-1111-111111111111',
  agreedPrice: 500,
  dueDate: '2026-12-01T00:00:00.000Z',
};

describe('ConsignmentsService.create', () => {
  it('is idempotent: returns the existing consignment without writing', async () => {
    const { service, reads, writes, partners } = build();
    reads.findByClientMutationId.mockResolvedValue({ id: 'existing' });
    const result = await service.create(caller, {
      ...dto,
      clientMutationId: 'k1',
    });
    expect(result).toEqual({ id: 'existing' });
    expect(partners.assertWithinCreditLimit).not.toHaveBeenCalled();
    expect(writes.createTransfer).not.toHaveBeenCalled();
  });

  it('rejects when the credit limit would be exceeded, before any write', async () => {
    const { service, writes, partners } = build();
    partners.assertWithinCreditLimit.mockRejectedValue(
      new ConflictException('limit'),
    );
    await expect(service.create(caller, dto)).rejects.toThrow(
      ConflictException,
    );
    expect(writes.createTransfer).not.toHaveBeenCalled();
  });

  it('checks credit then transfers with the caller as creator', async () => {
    const { service, writes, partners } = build();
    await service.create(caller, dto);
    expect(partners.assertWithinCreditLimit).toHaveBeenCalled();
    expect(writes.createTransfer).toHaveBeenCalledWith(
      expect.objectContaining({ code: dto.imei, createdById: 'u1' }),
    );
  });

  it('transfers a serial unit by its normalised serial number', async () => {
    const { service, writes } = build();
    await service.create(caller, {
      serialNumber: ' sn-1 ',
      partnerId: dto.partnerId,
      agreedPrice: 500,
      dueDate: dto.dueDate,
    });
    expect(writes.createTransfer).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'SN-1' }),
    );
  });

  it('defaults the agreed price to the unit PARTNER list price when omitted', async () => {
    const { service, writes, devices, pricing } = build();
    devices.findByCode.mockResolvedValue({
      id: 'dev-1',
      modelId: 'm1',
      specs: { storage: '256GB' },
      targetPrice: null,
    });
    pricing.listPriceForUnit.mockResolvedValue(new Prisma.Decimal(777));
    await service.create(caller, {
      imei: dto.imei,
      partnerId: dto.partnerId,
      dueDate: dto.dueDate,
    });
    expect(pricing.listPriceForUnit).toHaveBeenCalledWith(
      'PARTNER',
      expect.objectContaining({ deviceId: 'dev-1', storage: '256GB' }),
    );
    expect(writes.createTransfer).toHaveBeenCalledWith(
      expect.objectContaining({ agreedPrice: new Prisma.Decimal(777) }),
    );
  });

  it('rejects when no agreed price is given and the unit has no PARTNER price', async () => {
    const { service, devices, pricing } = build();
    devices.findByCode.mockResolvedValue({
      id: 'dev-1',
      modelId: 'm1',
      specs: {},
      targetPrice: null,
    });
    pricing.listPriceForUnit.mockResolvedValue(null);
    await expect(
      service.create(caller, {
        imei: dto.imei,
        partnerId: dto.partnerId,
        dueDate: dto.dueDate,
      }),
    ).rejects.toThrow(/no PARTNER price/i);
  });
});
