import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import type { Request, Response, NextFunction } from 'express';
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

  // Serve static assets from /uploads (for local storage driver and seeded showroom demo assets)
  const uploadsDir = join(process.cwd(), 'uploads');
  if (existsSync(uploadsDir) || isLocalDriver) {
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }

    app.useStaticAssets(uploadsDir, {
      prefix: '/uploads/',
    });
  }

  // Serve compiled React SPA in production if client build exists
  const candidateClientDirs = [
    join(process.cwd(), '../client/dist'),
    join(process.cwd(), 'apps/client/dist'),
    join(process.cwd(), 'client/dist'),
  ];
  const clientDist = candidateClientDirs.find((dir) => existsSync(dir));

  if (clientDist) {
    app.useStaticAssets(clientDist);

    // HTML5 pushState fallback for client-side routing
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (
        req.method === 'GET' &&
        !req.path.startsWith('/api') &&
        !req.path.startsWith('/uploads') &&
        !req.path.startsWith('/socket.io')
      ) {
        return res.sendFile(join(clientDist, 'index.html'));
      }
      next();
    });
  }

  app.enableShutdownHooks();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 [CapsLoc] Server listening on http://0.0.0.0:${port}`);
}
await bootstrap();
