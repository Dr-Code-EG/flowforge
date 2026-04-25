import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

import { User } from '../modules/users/user.entity';
import { Workflow } from '../modules/workflows/workflow.entity';
import { Credential } from '../modules/credentials/credential.entity';
import { Execution } from '../modules/executions/execution.entity';

export const ALL_ENTITIES = [User, Workflow, Credential, Execution];

/**
 * Build a TypeORM config that defaults to SQLite (Termux / local installs)
 * and switches to Postgres when DATABASE_TYPE=postgres or DATABASE_HOST is set.
 */
export function typeOrmFactory(config: ConfigService): TypeOrmModuleOptions {
  const driver =
    config.get<string>('DATABASE_TYPE') ||
    (config.get<string>('DATABASE_HOST') ? 'postgres' : 'sqlite');

  if (driver === 'postgres') {
    return {
      type: 'postgres',
      host: config.get<string>('DATABASE_HOST') || 'localhost',
      port: parseInt(config.get<string>('DATABASE_PORT') || '5432', 10),
      username: config.get<string>('DATABASE_USER') || 'flowforge',
      password: config.get<string>('DATABASE_PASSWORD') || 'flowforge',
      database: config.get<string>('DATABASE_NAME') || 'flowforge',
      entities: ALL_ENTITIES,
      synchronize: true, // dev-friendly; for production use migrations
      logging: false,
    };
  }

  // SQLite default — easiest for Termux & local installs.
  const dbFile =
    config.get<string>('DATABASE_FILE') ||
    join(process.cwd(), 'data', 'flowforge.sqlite');

  return {
    type: 'better-sqlite3',
    database: dbFile,
    entities: ALL_ENTITIES,
    synchronize: true,
    logging: false,
  };
}
