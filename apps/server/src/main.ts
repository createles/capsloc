import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const isLocalDriver = process.env.STORAGE_DRIVER === 'local' || (!process.env.STORAGE_DRIVER && !process.env.CLOUDINARY_CLOUD_NAME);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Global API routing prefix: /api/*
  app.setGlobalPrefix('api');

  // Enable cookie parsing for refresh token handling
  app.use(cookieParser());

  // Global DTO runtime validation & sanitization pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unexpected properties from DTOs
      forbidNonWhitelisted: true, // Reject requests with unexpected properties
      transform: true, // Auto-transform payloads into DTO instances
    }),
  );

  // Enable CORS with credentials for cross-origin requests from our Vite React Client
  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Serve static assets from /uploads if using local storage strategy
  if (isLocalDriver) {
    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    app.useStaticAssets(uploadsDir, {
      prefix: '/uploads/',
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
