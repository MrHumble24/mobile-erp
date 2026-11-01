import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthQueryDto } from './dto/health-check.dto.js';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async check(query?: HealthQueryDto) {
    const startTime = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1 as result`;
      const latencyMs = Date.now() - startTime;

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: 'up',
          latencyMs,
        },
        ...(query?.verbose && {
          details: {
            nodeVersion: process.version,
            memoryUsage: process.memoryUsage(),
            tag: query.tag ?? null,
          },
        }),
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          status: 'down',
          error:
            error instanceof Error ? error.message : 'Unknown database error',
        },
      });
    }
  }
}
