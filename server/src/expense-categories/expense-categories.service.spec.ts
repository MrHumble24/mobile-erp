import { ConflictException, NotFoundException } from '@nestjs/common';
import { ExpenseCategoriesService } from './expense-categories.service.js';
import { ExpenseCategoriesRepository } from './expense-categories.repository.js';

function build() {
  const repo = {
    findByName: jest.fn().mockResolvedValue(null),
    findById: jest.fn().mockResolvedValue({ id: 'c1', name: 'Rent' }),
    create: jest.fn().mockImplementation((dto) => Promise.resolve(dto)),
    update: jest.fn().mockResolvedValue({ id: 'c1' }),
    countExpenses: jest.fn().mockResolvedValue(0),
    reassign: jest.fn().mockResolvedValue(undefined),
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

  it('deactivates freely when the category has no expenses', async () => {
    const { service, repo } = build();
    repo.countExpenses.mockResolvedValue(0);
    await service.update('c1', { isActive: false });
    expect(repo.reassign).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith('c1', { isActive: false });
  });

  it('blocks deactivating a category in use without a reassign target', async () => {
    const { service, repo } = build();
    repo.countExpenses.mockResolvedValue(3);
    await expect(service.update('c1', { isActive: false })).rejects.toThrow(
      ConflictException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('reassigns rows then deactivates when a target is given', async () => {
    const { service, repo } = build();
    repo.countExpenses.mockResolvedValue(3);
    await service.update('c1', { isActive: false, reassignToId: 'c2' });
    expect(repo.reassign).toHaveBeenCalledWith('c1', 'c2');
    expect(repo.update).toHaveBeenCalledWith('c1', { isActive: false });
  });
});
