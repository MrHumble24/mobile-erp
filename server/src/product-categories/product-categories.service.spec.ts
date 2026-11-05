import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductCategoriesRepository } from './product-categories.repository.js';
import { ProductCategoriesService } from './product-categories.service.js';

function build() {
  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((d) => ({ id: 'c1', ...d })),
    update: jest.fn().mockImplementation((id, d) => ({ id, ...d })),
  };
  const service = new ProductCategoriesService(
    repo as unknown as ProductCategoriesRepository,
  );
  return { service, repo };
}

describe('ProductCategoriesService', () => {
  it('creates a category when the name is free', async () => {
    const { service, repo } = build();
    const res = await service.create({ name: 'Consoles' });
    expect(repo.create).toHaveBeenCalledWith({ name: 'Consoles' });
    expect(res).toMatchObject({ id: 'c1', name: 'Consoles' });
  });

  it('rejects a duplicate name', async () => {
    const { service, repo } = build();
    repo.findByName.mockResolvedValue({ id: 'other', name: 'Consoles' });
    await expect(service.create({ name: 'Consoles' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('404s when updating a missing category', async () => {
    const { service, repo } = build();
    repo.findById.mockResolvedValue(null);
    await expect(service.update('x', { name: 'A' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('require() returns the row or throws', async () => {
    const { service, repo } = build();
    repo.findById.mockResolvedValue({ id: 'c1', name: 'Consoles' });
    await expect(service.require('c1')).resolves.toMatchObject({ id: 'c1' });
  });
});
