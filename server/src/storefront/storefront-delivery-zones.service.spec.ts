import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/client/client.js';
import { StorefrontDeliveryZonesService } from './storefront-delivery-zones.service.js';
import type { StorefrontDeliveryZonesRepository } from './storefront-delivery-zones.repository.js';

describe('StorefrontDeliveryZonesService', () => {
  let service: StorefrontDeliveryZonesService;
  let repo: jest.Mocked<StorefrontDeliveryZonesRepository>;

  const zoneRow = {
    id: 'zone-1',
    name: 'Tashkent City',
    fee: new Prisma.Decimal(20000),
    sortOrder: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repo = {
      findMany: jest.fn(),
      findActive: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      countOrdersForZone: jest.fn(),
    } as unknown as jest.Mocked<StorefrontDeliveryZonesRepository>;

    service = new StorefrontDeliveryZonesService(repo);
  });

  it('lists delivery zones formatted', async () => {
    repo.findMany.mockResolvedValue([zoneRow]);
    const res = await service.list();
    expect(res).toEqual([
      {
        id: 'zone-1',
        name: 'Tashkent City',
        fee: '20000.00',
        sortOrder: 0,
        isActive: true,
      },
    ]);
  });

  it('creates delivery zone successfully', async () => {
    repo.create.mockResolvedValue(zoneRow);
    const res = await service.create({
      name: ' Tashkent City ',
      fee: 20000,
    });
    expect(repo.create).toHaveBeenCalledWith({
      name: 'Tashkent City',
      fee: 20000,
      sortOrder: undefined,
      isActive: undefined,
    });
    expect(res.name).toBe('Tashkent City');
  });

  it('handles unique violation on create', async () => {
    const p2002 = new Prisma.PrismaClientKnownRequestError('dup', {
      code: 'P2002',
      clientVersion: '5.0.0',
    });
    repo.create.mockRejectedValue(p2002);

    await expect(
      service.create({ name: 'Tashkent City', fee: 20000 }),
    ).rejects.toMatchObject({
      response: { code: 'DELIVERY_ZONE_NAME_EXISTS' },
    });
  });

  it('updates delivery zone', async () => {
    repo.findById.mockResolvedValue(zoneRow);
    repo.update.mockResolvedValue({
      ...zoneRow,
      fee: new Prisma.Decimal(25000),
    });

    const res = await service.update('zone-1', { fee: 25000 });
    expect(res.fee).toBe('25000.00');
  });

  it('throws 404 when updating non-existent zone', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.update('z-404', { fee: 100 })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('refuses deleting zone with existing orders', async () => {
    repo.findById.mockResolvedValue(zoneRow);
    repo.countOrdersForZone.mockResolvedValue(3);

    await expect(service.delete('zone-1')).rejects.toMatchObject({
      response: { code: 'ZONE_IN_USE' },
    });
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('deletes unused zone', async () => {
    repo.findById.mockResolvedValue(zoneRow);
    repo.countOrdersForZone.mockResolvedValue(0);
    repo.delete.mockResolvedValue(zoneRow);

    const res = await service.delete('zone-1');
    expect(res).toEqual({ deleted: true });
    expect(repo.delete).toHaveBeenCalledWith('zone-1');
  });
});
