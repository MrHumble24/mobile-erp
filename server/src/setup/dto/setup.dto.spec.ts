import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SetupDto } from './setup.dto.js';

describe('SetupDto validation', () => {
  const baseValid = {
    code: '0123456789ABCDEF0123456789ABCDEF',
    owner: {
      email: 'owner@example.com',
      password: 'password123',
      firstName: 'Alex',
    },
    company: {
      name: 'Super Market',
      currencyCode: 'USD',
      currencySign: '$',
      currencySignPosition: 'before',
      currencyDecimals: 2,
      timeZone: 'Asia/Tashkent',
      defaultLanguage: 'uz',
    },
    firstStore: {
      name: 'Super Market Main',
    },
    switches: {
      discountsEnabled: true,
    },
  };

  it('accepts a valid setup payload matching buildSetupPayload', async () => {
    const dto = plainToInstance(SetupDto, baseValid);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors).toHaveLength(0);
  });

  it('rejects payload with extra field "step"', async () => {
    const withStep = { ...baseValid, step: 7 };
    const dto = plainToInstance(SetupDto, withStep);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.length).toBeGreaterThan(0);
    const stepError = errors.find((e) => e.property === 'step');
    expect(stepError).toBeDefined();
    expect(stepError?.constraints?.whitelistValidation).toContain(
      'property step should not exist',
    );
  });

  it('rejects invalid currency parameters and timezone (C2, C4)', async () => {
    const invalidDto = plainToInstance(SetupDto, {
      ...baseValid,
      company: {
        ...baseValid.company,
        currencyCode: 'US', // min 3
        currencySignPosition: 'middle', // must be before or after
        currencyDecimals: 3, // must be 0 or 2
        timeZone: 'Invalid/NonExistent_Zone', // must be valid Intl timezone
      },
    });
    const errors = await validate(invalidDto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.length).toBeGreaterThan(0);
    const companyErr = errors.find((e) => e.property === 'company');
    expect(companyErr?.children?.length).toBeGreaterThanOrEqual(4);
  });
});
