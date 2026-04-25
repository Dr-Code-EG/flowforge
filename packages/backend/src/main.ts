import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule, frontendDist } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
    bodyParser: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const config = app.get(ConfigService);
  const port = parseInt(config.get<string>('BACKEND_PORT') || '3000', 10);
  await app.listen(port, '0.0.0.0');
  logger.log(`FlowForge backend listening on http://0.0.0.0:${port}`);
  logger.log(`Public URL: ${config.get<string>('PUBLIC_URL') || `http://localhost:${port}`}`);
  if (frontendDist) {
    logger.log(`Serving frontend from: ${frontendDist}`);
  } else {
    logger.warn('Frontend dist not found — only the API is exposed.');
  }
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start FlowForge backend:', err);
  process.exit(1);
});
