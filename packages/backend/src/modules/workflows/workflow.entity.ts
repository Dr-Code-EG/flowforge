import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type {
  WorkflowConnection,
  WorkflowNode,
  WorkflowSettings,
} from '@flowforge/shared';

@Entity({ name: 'workflows' })
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Index()
  @Column({ default: false })
  active!: boolean;

  /** Stored as JSON text (TypeORM `simple-json`) for SQLite/Postgres portability. */
  @Column({ type: 'simple-json' })
  nodes!: WorkflowNode[];

  @Column({ type: 'simple-json' })
  connections!: WorkflowConnection[];

  @Column({ type: 'simple-json', nullable: true })
  settings?: WorkflowSettings | null;

  @Column({ type: 'simple-json', nullable: true })
  tags?: string[] | null;

  @Index()
  @Column()
  ownerId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
