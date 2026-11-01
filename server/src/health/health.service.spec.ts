import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ServiceUnavailableException } from '@nestjs/common';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return status ok when database responds', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ result: 1 }]);

    const response = await service.check();
    expect(response.status).toBe('ok');
    expect(response.database.status).toBe('up');
    expect(typeof response.database.latencyMs).toBe('number');
  });

  it('should include details when verbose is true', async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ result: 1 }]);

    const response = await service.check({ verbose: true, tag: 'v1' });
    expect(response.status).toBe('ok');
    expect(response.details).toBeDefined();
    expect(response.details?.tag).toBe('v1');
  });

  it('should throw ServiceUnavailableException when database query fails', async () => {
    prisma.$queryRaw.mockRejectedValueOnce(new Error('Connection failed'));

    await expect(service.check()).rejects.toThrow(ServiceUnavailableException);
  });
});
