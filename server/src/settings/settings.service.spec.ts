import { StoresService } from '../stores/stores.service.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { SettingsRepository } from './settings.repository.js';
import { SettingsService } from './settings.service.js';

const ROW = {
  id: 1,
  receiptFooter: null,
  telegramChatId: null,
  closingTime: '20:00',
  defaultWarrantyDays: 14,
  minMarginPercent: 0,
  lowStockThreshold: 2,
  defaultNasiyaDueDays: 30,
  overdueReminderDays: 3,
  digestSentOn: null,
  updatedAt: new Date(0),
};

function build() {
  const repo = {
    get: jest.fn().mockResolvedValue(ROW),
    upsert: jest.fn().mockResolvedValue(ROW),
  };
  const stores = {
    currentStoreId: jest.fn().mockResolvedValue('store-1'),
    getIdentity: jest
      .fn()
      .mockResolvedValue({ name: 'Malika', address: 'Chorsu', phone: '+998' }),
    updateIdentity: jest.fn().mockResolvedValue(undefined),
  };
  const service = new SettingsService(
    repo as unknown as SettingsRepository,
    stores as unknown as StoresService,
  );
  return { service, repo, stores };
}

describe('SettingsService', () => {
  it('get() merges store identity into the settings response', async () => {
    const { service } = build();
    const result = await service.get();
    expect(result).toMatchObject({
      closingTime: '20:00',
      storeName: 'Malika',
      storeAddress: 'Chorsu',
      storePhone: '+998',
    });
  });

  it('update() writes identity through stores and the rest through the repo', async () => {
    const { service, repo, stores } = build();
    const dto = {
      storeName: 'New Name',
      storeAddress: 'New Addr',
      storePhone: '+111',
      closingTime: '19:00',
      defaultWarrantyDays: 30,
      minMarginPercent: 5,
      lowStockThreshold: 3,
      defaultNasiyaDueDays: 45,
      overdueReminderDays: 2,
    } as UpdateSettingsDto;
    await service.update(dto);
    expect(stores.updateIdentity).toHaveBeenCalledWith({
      name: 'New Name',
      address: 'New Addr',
      phone: '+111',
    });
    expect(repo.upsert.mock.calls[0][0]).toBe('store-1');
    const persisted = repo.upsert.mock.calls[0][1];
    expect(persisted).not.toHaveProperty('storeName');
    expect(persisted).toMatchObject({ closingTime: '19:00' });
  });
});
