import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('AppController & Health (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Assalomu alaykum!');
  });

  it('/health (GET) should return 200 and database status up', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('database');
    expect(response.body.database).toHaveProperty('status', 'up');
    expect(typeof response.body.database.latencyMs).toBe('number');
  });

  it('/health (GET) should transform boolean query and return verbose details', async () => {
    const response = await request(app.getHttpServer())
      .get('/health?verbose=true&tag=e2e-test')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('details');
    expect(response.body.details).toHaveProperty('tag', 'e2e-test');
    expect(response.body.details).toHaveProperty('memoryUsage');
  });

  it('/health (GET) should fail validation with 400 when invalid query parameters are supplied', async () => {
    const response = await request(app.getHttpServer())
      .get('/health?unrecognizedParam=malicious')
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Bad Request');
  });
});
