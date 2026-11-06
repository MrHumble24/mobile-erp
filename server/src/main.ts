import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import {
  json,
  static as serveStatic,
  urlencoded,
  type Response,
} from 'express';
import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { IMAGE_URL_PREFIX } from './common/lib/image-url.js';
import { corsOrigins } from './common/lib/origins.js';

/**
 * Serves product pictures: public, read-only, cross-origin (the web client runs
 * on another origin and an <img> cannot send a token). Only this one directory
 * is exposed, cached hard, with nosniff. Created on start; on Railway
 * UPLOADS_DIR must be a mounted volume (server/README.md). ADR 0031.
 */
function mountUploads(app: INestApplication): void {
  const uploadsDir = process.env.UPLOADS_DIR?.trim() || './uploads';
  mkdirSync(uploadsDir, { recursive: true });
  app.use(
    IMAGE_URL_PREFIX,
    serveStatic(uploadsDir, {
      index: false,
      maxAge: '365d',
      immutable: true,
      setHeaders: (res: Response) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    }),
  );
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  const trustHops = Math.max(
    0,
    parseInt(process.env.TRUST_PROXY_HOPS ?? '0', 10) || 0,
  );
  if (trustHops > 0) {
    app.set('trust proxy', trustHops);
  }

  app.enableShutdownHooks();

  // Production serves the client same-origin, so CORS stays off unless CORS_ORIGINS
  // lists browser origins. Dev defaults to the Vite origins so no .env edit is needed.
  const origins = corsOrigins();
  if (origins.length > 0) {
    app.enableCors({
      origin: origins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Authorization', 'Content-Type', 'X-Store-Id'],
    });
  }

  app.use(helmet());
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  mountUploads(app);

  app.useGlobalFilters(new HttpExceptionFilter());

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

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}`);
}

void bootstrap();
