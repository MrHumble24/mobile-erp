import { CompanyController } from './company.controller.js';

describe('CompanyController', () => {
  let controller: CompanyController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      saveLogo: jest.fn(),
      listThemes: jest.fn(),
    };
    controller = new CompanyController(mockService);
  });

  it('delegates logo upload to service when file buffer is present', async () => {
    const dummyBuffer = Buffer.from([1, 2, 3]);
    await controller.uploadLogo({ buffer: dummyBuffer });
    expect(mockService.saveLogo).toHaveBeenCalledWith(dummyBuffer);
  });

  it('throws BadRequestException when no file buffer uploaded', () => {
    expect(() => controller.uploadLogo(undefined)).toThrow(
      'No image file was uploaded',
    );
  });
});
