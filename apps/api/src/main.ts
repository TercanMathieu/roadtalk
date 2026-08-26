import 'dotenv/config';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from './app.module';
import { env } from './infrastructure/config/env';
import { HttpExceptionFilter } from './infrastructure/errors/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(env.PORT, '0.0.0.0');
}

void bootstrap();
