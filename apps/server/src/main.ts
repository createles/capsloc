import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global API routing prefix: /api/*
  app.setGlobalPrefix('api');

  // Enable cookie parsing for refresh token handling
  app.use(cookieParser());

  // Global DTO runtime validation & sanitization pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,  // Strip unexpected properties from DTOs
      forbidNonWhitelisted: true, // Reject requests with unexpected properties
      transform: true, // Auto-transform payloads into DTO instances
    }),
  );

  // Enable CORS with credentials for cross-origin requests from our Vite React Client
  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
