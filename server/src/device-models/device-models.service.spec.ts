import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProductCategoriesService } from '../product-categories/product-categories.service.js';
import { DeviceModelsRepository } from './device-models.repository.js';
import { DeviceModelsService } from './device-models.service.js';

function build() {
  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    kindIsActive: jest.fn().mockResolvedValue(true),
    countUnits: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockImplementation((d) => ({ id: 'm1', ...d })),
    update: jest.fn().mockImplementation((id, d) => ({ id, ...d })),
  };
  const categories = { require: jest.fn().mockResolvedValue({ id: 'cat1' }) };
  const service = new DeviceModelsService(
    repo as unknown as DeviceModelsRepository,
    categories as unknown as ProductCategoriesService,
  );
  return { service, repo, categories };
}

describe('DeviceModelsService.create', () => {
  it('defaults kind to IMEI', async () => {
    const { service, repo } = build();
    await service.create({ brand: 'Apple', name: 'iPhone 15' });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ kindCode: 'IMEI' }),
    );
  });

  it('rejects an unknown kind', async () => {
    const { service, repo } = build();
    repo.kindIsActive.mockResolvedValue(false);
    await expect(
      service.create({ brand: 'A', name: 'B', kindCode: 'BOGUS' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('validates the category when provided', async () => {
    const { service, categories } = build();
    await service.create({
      brand: 'Sony',
      name: 'PS5',
      kindCode: 'SERIAL',
      categoryId: '11111111-1111-1111-1111-111111111111',
    });
    expect(categories.require).toHaveBeenCalled();
  });

  it('maps a barcode unique violation to 409', async () => {
    const { service, repo } = build();
    repo.create.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['barcode'] },
    });
    await expect(
      service.create({ brand: 'A', name: 'B', barcode: '590000' }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('DeviceModelsService.update', () => {
  it('blocks a kind change once the model has units', async () => {
    const { service, repo } = build();
    repo.findById.mockResolvedValue({ id: 'm1', kindCode: 'IMEI' });
    repo.countUnits.mockResolvedValue(2);
    await expect(service.update('m1', { kindCode: 'SERIAL' })).rejects.toThrow(
      ConflictException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('allows a kind change when the model has no units', async () => {
    const { service, repo } = build();
    repo.findById.mockResolvedValue({ id: 'm1', kindCode: 'IMEI' });
    repo.countUnits.mockResolvedValue(0);
    await service.update('m1', { kindCode: 'SERIAL' });
    expect(repo.update).toHaveBeenCalledWith(
      'm1',
      expect.objectContaining({ kindCode: 'SERIAL' }),
    );
  });

  it('404s on a missing model', async () => {
    const { service, repo } = build();
    repo.findById.mockResolvedValue(null);
    await expect(service.update('x', { brand: 'A' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
