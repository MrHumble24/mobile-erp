import { ConflictException, NotFoundException } from '@nestjs/common';
import { ExpenseCategoriesService } from './expense-categories.service.js';
import { ExpenseCategoriesRepository } from './expense-categories.repository.js';

function build() {
  const repo = {
    findByName: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue({ id: 'c1', name: 'Rent' }),
    create: jest.fn().mockImplementation((dto) => Promise.resolve(dto)),
    update: jest.fn().mockResolvedValue({ id: 'c1' }),
  };
  const service = new ExpenseCategoriesService(
    repo as unknown as ExpenseCategoriesRepository,
  );
  return { service, repo };
}

describe('ExpenseCategoriesService', () => {
  it('rejects a duplicate name with 409', async () => {
    const { service, repo } = build();
    repo.findByName.mockResolvedValue({ id: 'other', name: 'Rent' });
    await expect(service.create({ name: 'Rent' })).rejects.toThrow(
      ConflictException,
    );
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('allows renaming to the same row own name', async () => {
    const { service, repo } = build();
    repo.findByName.mockResolvedValue({ id: 'c1', name: 'Rent' });
    await service.update('c1', { name: 'Rent' });
    expect(repo.update).toHaveBeenCalled();
  });

  it('404s when updating a missing category', async () => {
    const { service, repo } = build();
    repo.findById.mockResolvedValue(null);
    await expect(service.update('x', { sortOrder: 1 })).rejects.toThrow(
      NotFoundException,
    );
  });
});
