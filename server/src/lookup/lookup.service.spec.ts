import { NotFoundException } from '@nestjs/common';
import { DeviceModelsService } from '../device-models/device-models.service.js';
import type { DeviceModelView } from '../device-models/types/device-model.types.js';
import { LookupRepository } from './lookup.repository.js';
import { LookupService } from './lookup.service.js';

function model(partial: Partial<DeviceModelView>): DeviceModelView {
  return {
    id: 'm',
    brand: 'Apple',
    name: 'iPhone 15 Pro Max',
    isActive: true,
    kindCode: 'IMEI',
    categoryId: null,
    barcode: null,
    modelCode: null,
    customsCode: null,
    salePrice: null,
    imageUrl: null,
    attributes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partial,
  };
}

function build(models: DeviceModelView[]) {
  const repo = {
    findBoxCode: jest.fn(),
    findAppleModelNumbers: jest.fn().mockResolvedValue([]),
    findSamsungModelCode: jest.fn().mockResolvedValue(null),
    searchSamsung: jest.fn().mockResolvedValue([]),
    searchAppleModels: jest.fn().mockResolvedValue([]),
    findAppleModelOptions: jest.fn().mockResolvedValue([]),
    findTac: jest.fn(),
    findLinkModelId: jest.fn().mockResolvedValue(null),
    upsertLink: jest.fn().mockResolvedValue(undefined),
  };
  const deviceModels = {
    list: jest.fn().mockResolvedValue(models),
    get: jest.fn().mockResolvedValue(models[0] ?? model({})),
  };
  const service = new LookupService(
    repo as unknown as LookupRepository,
    deviceModels as unknown as DeviceModelsService,
  );
  return { service, repo, deviceModels };
}

const appleBox = {
  brand: 'Apple',
  model: 'iPhone 15 Pro Max',
  color: 'Natural Titanium',
  storage: '256GB',
  ram: null,
};

describe('LookupService.lookup — resolving the code', () => {
  it('resolves an Apple box code (region suffix/case/spaces stripped)', async () => {
    const { service, repo } = build([]);
    repo.findBoxCode.mockResolvedValue(appleBox);
    const res = await service.lookup('mu793ll/a');
    expect(repo.findBoxCode).toHaveBeenCalledWith('MU793');
    expect(res.source.license).toBe('CC BY-SA 4.0');
    expect(res.reference.storage).toBe('256GB');
    expect(res.product).toBeNull();
  });

  it('resolves a 15-digit IMEI by its TAC', async () => {
    const { service, repo } = build([]);
    repo.findTac.mockResolvedValue({ brand: 'Apple', model: 'iPhone 11' });
    const res = await service.lookup('359824370000001');
    expect(repo.findTac).toHaveBeenCalledWith('35982437');
    expect(res.reference.brand).toBe('Apple');
    expect(res.source.name).toContain('tac-database');
  });

  it('resolves an Apple hardware model number (A-number)', async () => {
    const { service, repo } = build([]);
    repo.findAppleModelNumbers.mockResolvedValue([
      {
        brand: 'Apple',
        model: 'iPhone 18 Pro Max',
        color: 'Silver',
        storage: '256GB',
        ram: null,
        boxCode: 'MJW54',
      },
      {
        brand: 'Apple',
        model: 'iPhone 18 Pro Max',
        color: 'Black',
        storage: '512GB',
        ram: null,
        boxCode: 'MJW94',
      },
    ]);
    const res = await service.lookup('a3473');
    expect(repo.findAppleModelNumbers).toHaveBeenCalledWith('A3473');
    expect(res.reference.model).toBe('iPhone 18 Pro Max');
    expect(res.reference.modelNumber).toBe('A3473');
    expect(res.reference.storageOptions).toEqual(['256GB', '512GB']);
    expect(res.reference.colorOptions).toEqual(['Silver', 'Black']);
    expect(res.reference.variants).toHaveLength(2);
  });

  it('resolves a Samsung model code', async () => {
    const { service, repo } = build([]);
    repo.findSamsungModelCode.mockResolvedValue({
      brand: 'Samsung',
      model: 'Galaxy S23 Ultra',
      series: 'S',
      codename: 'dm3q',
      modelCode: 'SM-S918B',
      storageOptions: ['256GB', '512GB', '1TB'],
      colorOptions: ['Phantom Black', 'Green'],
    });
    const res = await service.lookup('sm-s918b/ds');
    expect(repo.findSamsungModelCode).toHaveBeenCalledWith('SM-S918B');
    expect(res.reference.brand).toBe('Samsung');
    expect(res.reference.model).toBe('Galaxy S23 Ultra');
    expect(res.reference.storageOptions).toEqual(['256GB', '512GB', '1TB']);
    expect(res.reference.colorOptions).toEqual(['Phantom Black', 'Green']);
    expect(res.source.name).toContain('Google Play');
  });

  it('404s when neither list knows the code', async () => {
    const { service, repo } = build([]);
    repo.findBoxCode.mockResolvedValue(null);
    await expect(service.lookup('ZZZZZ')).rejects.toThrow(NotFoundException);
  });
});

describe('LookupService — naming our product, in order', () => {
  const linkTarget = model({
    id: 'link',
    name: 'iPhone 15 Pro Max',
    modelCode: null,
  });
  const codeTarget = model({
    id: 'code',
    name: 'Totally Different',
    modelCode: 'MU793',
  });
  const nameTarget = model({
    id: 'name',
    name: 'iPhone 15 Pro Max',
    modelCode: null,
  });

  it('prefers a learned link over everything', async () => {
    const { service, repo } = build([linkTarget, codeTarget]);
    repo.findBoxCode.mockResolvedValue(appleBox);
    repo.findLinkModelId.mockResolvedValue('link');
    const res = await service.lookup('MU793');
    expect(res.product?.matchedBy).toBe('link');
    expect(res.product?.modelId).toBe('link');
  });

  it('falls back to a modelCode equal to the code', async () => {
    const { service, repo } = build([codeTarget]);
    repo.findBoxCode.mockResolvedValue(appleBox);
    const res = await service.lookup('MU793');
    expect(res.product?.matchedBy).toBe('modelCode');
    expect(res.product?.modelId).toBe('code');
  });

  it('falls back to brand+name (ignoring brand word/case/space)', async () => {
    const { service, repo } = build([nameTarget]);
    repo.findBoxCode.mockResolvedValue(appleBox);
    const res = await service.lookup('MU793');
    expect(res.product?.matchedBy).toBe('name');
    expect(res.product?.modelId).toBe('name');
  });

  it('fills the product option matching the reference storage/colour', async () => {
    const withAttrs = model({
      id: 'name',
      attributes: [
        {
          key: 'storage',
          label: 'Storage',
          type: 'select',
          options: ['256GB'],
          required: true,
          sortOrder: 10,
        },
        {
          key: 'color',
          label: 'Color',
          type: 'select',
          options: ['Natural Titanium'],
          required: false,
          sortOrder: 20,
        },
      ],
    });
    const { service, repo } = build([withAttrs]);
    repo.findBoxCode.mockResolvedValue(appleBox);
    const res = await service.lookup('MU793');
    expect(res.product?.storageOption).toBe('256GB');
    expect(res.product?.colorOption).toBe('Natural Titanium');
  });
});

describe('LookupService.learnLink', () => {
  it('validates the product and stores a link keyed by the reference model', async () => {
    const { service, repo, deviceModels } = build([model({ id: 'p1' })]);
    await service.learnLink('Samsung', 'Galaxy S23', 'p1');
    expect(deviceModels.get).toHaveBeenCalledWith('p1');
    expect(repo.upsertLink).toHaveBeenCalledWith(
      'samsung|galaxys23',
      'Samsung',
      'Galaxy S23',
      'p1',
    );
  });
});

describe('LookupService.search', () => {
  it('returns empty array when query is under 2 chars', async () => {
    const { service } = build([]);
    expect(await service.search('a')).toEqual([]);
    expect(await service.search('  ')).toEqual([]);
  });

  it('searches both Samsung and Apple reference lists and aggregates options', async () => {
    const { service, repo } = build([]);
    repo.searchSamsung.mockResolvedValue([
      {
        brand: 'Samsung',
        model: 'Galaxy S23 Ultra',
        series: 'S',
        codename: 'dm3q',
        modelCode: 'SM-S918B',
        storageOptions: ['256GB', '512GB'],
        colorOptions: ['Green', 'Phantom Black'],
      },
    ]);
    repo.searchAppleModels.mockResolvedValue([
      {
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        modelNumber: 'A3102',
      },
    ]);
    repo.findAppleModelOptions.mockResolvedValue([
      { storage: '128GB', color: 'Natural Titanium' },
      { storage: '256GB', color: 'Natural Titanium' },
    ]);

    const results = await service.search('pro');
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      brand: 'Samsung',
      model: 'Galaxy S23 Ultra',
      series: 'S',
      modelCode: 'SM-S918B',
      kindCode: 'IMEI',
      storageOptions: ['256GB', '512GB'],
      colorOptions: ['Green', 'Phantom Black'],
    });
    expect(results[1]).toEqual({
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      modelCode: 'A3102',
      kindCode: 'IMEI',
      storageOptions: ['128GB', '256GB'],
      colorOptions: ['Natural Titanium'],
    });
  });
});
