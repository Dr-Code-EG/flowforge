import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join, resolve } from 'path';
import { existsSync } from 'fs';

import { typeOrmFactory } from './config/typeorm.config';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CredentialsModule } from './modules/credentials/credentials.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { ExecutionsModule } from './modules/executions/executions.module';
import { NodesModule } from './modules/nodes/nodes.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { TriggersModule } from './modules/triggers/triggers.module';
import { EngineModule } from './modules/engine/engine.module';

function findFrontendDist(): string | null {
  const env = process.env.FRONTEND_DIST;
  if (env && existsSync(env)) return env;
  // Walk up from the current file looking for packages/frontend/dist
  const candidates = [
    join(__dirname, '..', 'frontend', 'dist'),
    join(__dirname, '..', '..', 'frontend', 'dist'),
    join(__dirname, '..', '..', '..', 'frontend', 'dist'),
    join(__dirname, '..', '..', '..', '..', 'frontend', 'dist'),
    resolve(process.cwd(), 'packages', 'frontend', 'dist'),
    resolve(process.cwd(), '..', 'frontend', 'dist'),
  ];
  for (const c of candidates) {
    if (existsSync(c) && existsSync(join(c, 'index.html'))) return c;
  }
  return null;
}

export const frontendDist = findFrontendDist();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmFactory,
    }),
    ScheduleModule.forRoot(),
    // Serve built frontend statics from the same port (Termux/single-port mode)
    ...(frontendDist
      ? [
          ServeStaticModule.forRoot({
            rootPath: frontendDist,
            exclude: ['/api/(.*)', '/webhook/(.*)', '/webhook-test/(.*)'],
            serveStaticOptions: { fallthrough: true },
          }),
        ]
      : []),
    EngineModule,
    NodesModule,
    AuthModule,
    UsersModule,
    CredentialsModule,
    WorkflowsModule,
    ExecutionsModule,
    WebhooksModule,
    TriggersModule,
  ],
})
export class AppModule {}
