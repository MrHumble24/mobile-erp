import { StoresRepository } from './stores.repository.js';
import { StoresService } from './stores.service.js';

function build() {
  const repo = {
    currentId: jest.fn().mockResolvedValue('store-1'),
    getIdentity: jest
      .fn()
      .mockResolvedValue({ name: 'Malika', address: 'Chorsu', phone: '+998' }),
    updateIdentity: jest.fn().mockResolvedValue(undefined),
  };
  const service = new StoresService(repo as unknown as StoresRepository);
  return { service, repo };
}

describe('StoresService', () => {
  it('currentStoreId returns the single store id', async () => {
    const { service } = build();
    await expect(service.currentStoreId()).resolves.toBe('store-1');
  });

  it('getIdentity returns the store identity', async () => {
    const { service } = build();
    await expect(service.getIdentity()).resolves.toEqual({
      name: 'Malika',
      address: 'Chorsu',
      phone: '+998',
    });
  });

  it('updateIdentity resolves the store id then writes', async () => {
    const { service, repo } = build();
    await service.updateIdentity({ name: 'New' });
    expect(repo.updateIdentity).toHaveBeenCalledWith('store-1', {
      name: 'New',
    });
  });
});
