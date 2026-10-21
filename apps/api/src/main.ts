import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const logger = new Logger('GrievEase-API');
  const app = await NestFactory.create(AppModule);

  // 1. Security Headers (Helmet + Strict CSP)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. Cookie Parser
  app.use(cookieParser());

  // 3. CORS Configuration
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Step-Up-Token', 'X-CSRF-Token', 'X-Client'],
  });

  // 4. Global Prefix: /api/v1
  app.setGlobalPrefix('api/v1');

  // 5. Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // 6. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // 7. OpenAPI / Swagger UI (Dev Only)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('GrievEase REST API')
      .setDescription('GrievEase Society Management & Governance Platform API v1 (Supports Browser Cookies & Mobile Bearer/X-Client)')
      .setVersion('1.0')
      .addBearerAuth()
      .addApiKey({ type: 'apiKey', name: 'X-Client', in: 'header', description: 'Pass "mobile" to receive JWT tokens directly in response body' }, 'X-Client')
      .addApiKey({ type: 'apiKey', name: 'X-Step-Up-Token', in: 'header', description: '5-minute elevated session token for sensitive admin operations' }, 'X-Step-Up-Token')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('📄 Swagger UI available in development at http://localhost:4000/api/docs');
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 GrievEase API listening on http://localhost:${port}/api/v1`);
}

bootstrap();
