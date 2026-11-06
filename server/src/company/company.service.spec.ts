import { BadRequestException } from '@nestjs/common';
import { CompanyService } from './company.service.js';

describe('CompanyService', () => {
  let service: CompanyService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      hasUsers: jest.fn().mockResolvedValue(true),
      getProfile: jest.fn().mockResolvedValue({
        id: 'default',
        name: 'Test Shop',
        logoFile: 'logo-123.png',
        themeCode: 'caldera',
        defaultLanguage: 'uz',
        timeZone: 'Asia/Tashkent',
        currencyCode: 'USD',
        currencySign: '$',
        currencySignPosition: 'before',
        currencyDecimals: 2,
        sessionDuration: '12h',
      }),
      listThemes: jest.fn().mockResolvedValue([
        { code: 'caldera', name: 'Caldera Light' },
        { code: 'obsidian', name: 'Obsidian Dark' },
      ]),
      findTheme: jest.fn((code: string) =>
        code === 'caldera' || code === 'obsidian'
          ? Promise.resolve({ code })
          : Promise.resolve(null),
      ),
      updateProfile: jest.fn((data: any) =>
        Promise.resolve({ ...data, id: 'default' }),
      ),
    };
    service = new CompanyService(mockRepo);
  });

  it('returns clean public branding without sensitive fields', async () => {
    const branding = await service.getBranding();
    expect(branding).toEqual({
      name: 'Test Shop',
      logoUrl: '/uploads/logo-123.png',
      themeCode: 'caldera',
      defaultLanguage: 'uz',
      currency: {
        code: 'USD',
        sign: '$',
        signPosition: 'before',
        decimals: 2,
      },
    });
    expect((branding as any).password).toBeUndefined();
    expect((branding as any).token).toBeUndefined();
    expect((branding as any).secret).toBeUndefined();
  });

  it('returns null shop name before setup (when no users exist)', async () => {
    mockRepo.hasUsers.mockResolvedValue(false);
    const branding = await service.getBranding();
    expect(branding.name).toBeNull();
  });

  it('rejects SVG and non-image files on logo upload', async () => {
    const svgBuffer = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><circle/></svg>',
    );
    await expect(service.saveLogo(svgBuffer)).rejects.toThrow(
      BadRequestException,
    );

    const textBuffer = Buffer.from('hello world text file');
    await expect(service.saveLogo(textBuffer)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('accepts valid PNG image and returns logoUrl', async () => {
    // Valid PNG signature: 89 50 4E 47 0D 0A 1A 0A + dummy bytes
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    const result = await service.saveLogo(pngHeader);
    expect(result.logoUrl).toMatch(/^\/uploads\/logo-.+\.png$/);
    expect(mockRepo.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        logoFile: expect.stringMatching(/^logo-.+\.png$/),
      }),
    );
  });

  it('validates theme code on profile update', async () => {
    await expect(
      service.updateProfile({ themeCode: 'invalid-theme' }),
    ).rejects.toThrow(BadRequestException);

    await service.updateProfile({ themeCode: 'obsidian', name: 'New Name' });
    expect(mockRepo.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ themeCode: 'obsidian', name: 'New Name' }),
    );
  });
});
