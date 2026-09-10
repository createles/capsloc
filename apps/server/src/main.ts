import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // Establish uploads directory exists on disk
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

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

  // Serve static assets from /uploads
  app.useStaticAssets(uploadsDir, {
    /**
     * Intercepts requests to URLs beginning with '/uploads/'
     * then strips prefix and maps the rest of the path to the physical
     * disk location (e.g. GET /uploads/1235-uuid.png -> ./uploads/1235-uuid.png)
     */
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
