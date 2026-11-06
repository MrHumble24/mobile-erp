import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateStorefrontOrderDto } from './create-order.dto.js';

describe('CreateStorefrontOrderDto Specs Validation (F4 / audit L3)', () => {
  it('accepts valid specs with storage and color', async () => {
    const plain = {
      name: 'Valid Customer',
      phone: '+998901234567',
      modelId: 'c3d559e4-9cf7-4837-a5de-1720ed4e642b',
      storeId: 'ab8e3497-4cf8-4f3f-8eaf-77083be03a2b',
      specs: { storage: '256GB', color: 'White' },
    };

    const instance = plainToInstance(CreateStorefrontOrderDto, plain);
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects unexpected specs fields (anything other than storage and color)', async () => {
    const plain = {
      name: 'Valid Customer',
      phone: '+998901234567',
      modelId: 'c3d559e4-9cf7-4837-a5de-1720ed4e642b',
      storeId: 'ab8e3497-4cf8-4f3f-8eaf-77083be03a2b',
      specs: { storage: '256GB', color: 'White', evilPayload: '123' },
    };

    const instance = plainToInstance(CreateStorefrontOrderDto, plain);
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.length).toBeGreaterThan(0);
    const specsError = errors.find((e) => e.property === 'specs');
    expect(specsError).toBeDefined();
    expect(specsError?.children?.[0]?.property).toBe('evilPayload');
  });

  it('rejects non-string specs values', async () => {
    const plain = {
      name: 'Valid Customer',
      phone: '+998901234567',
      modelId: 'c3d559e4-9cf7-4837-a5de-1720ed4e642b',
      storeId: 'ab8e3497-4cf8-4f3f-8eaf-77083be03a2b',
      specs: { storage: 128 },
    };

    const instance = plainToInstance(CreateStorefrontOrderDto, plain);
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});
