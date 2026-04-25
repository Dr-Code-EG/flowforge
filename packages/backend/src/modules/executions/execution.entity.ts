import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type {
  ExecutionData,
  ExecutionMode,
  ExecutionStatus,
} from '@flowforge/shared';

@Entity({ name: 'executions' })
export class Execution {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  workflowId!: string;

  @Column()
  workflowName!: string;

  @Index()
  @Column()
  status!: ExecutionStatus;

  @Column()
  mode!: ExecutionMode;

  // Use ISO strings for datetime fields so the schema stays driver-agnostic
  // (better-sqlite3 doesn't accept TypeORM's "Object"-typed Date columns).
  @Column({ type: 'varchar' })
  startedAt!: string;

  @Column({ type: 'varchar', nullable: true })
  finishedAt?: string | null;

  @Column({ type: 'simple-json' })
  data!: ExecutionData;

  @Column({ type: 'simple-json', nullable: true })
  error?: { message: string; nodeId?: string } | null;
}
