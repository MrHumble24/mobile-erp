import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  INestApplication,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { Throttle, ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import type { App } from 'supertest/types';

@Controller('proxy-test')
class TestProxyController {
  @Get()
  @Throttle({ default: { limit: 1, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  testEndpoint() {
    return { ok: true };
  }
}

describe('Storefront Proxy Rate Limiting (F2 / audit M1)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 10,
          },
        ]),
      ],
      controllers: [TestProxyController],
      providers: [
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    const nestApp =
      moduleFixture.createNestApplication<NestExpressApplication>();
    nestApp.set('trust proxy', 1);
    app = await nestApp.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('two different forwarded addresses get separate buckets', async () => {
    // Address A first request consumes its 1-request bucket
    await request(app.getHttpServer())
      .get('/proxy-test')
      .set('X-Forwarded-For', '203.0.113.1')
      .expect(200);

    // Address A second request is rate-limited (429)
    await request(app.getHttpServer())
      .get('/proxy-test')
      .set('X-Forwarded-For', '203.0.113.1')
      .expect(429);

    // Address B has its own bucket and succeeds (200)
    await request(app.getHttpServer())
      .get('/proxy-test')
      .set('X-Forwarded-For', '203.0.113.2')
      .expect(200);

    // Address B second request is now rate-limited (429)
    await request(app.getHttpServer())
      .get('/proxy-test')
      .set('X-Forwarded-For', '203.0.113.2')
      .expect(429);
  });

  it('client-supplied extra X-Forwarded-For entry does not get a fresh bucket', async () => {
    // Address A is already throttled. Client tries spoofing: 'spoofed-client-ip, 203.0.113.1'
    // With trust proxy = 1, Express resolves the client IP to the 1st hop behind proxy (203.0.113.1)
    await request(app.getHttpServer())
      .get('/proxy-test')
      .set('X-Forwarded-For', '198.51.100.99, 203.0.113.1')
      .expect(429);
  });
});
