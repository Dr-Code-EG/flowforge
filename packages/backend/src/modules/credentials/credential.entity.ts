import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'credentials' })
export class Credential {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Index()
  @Column()
  type!: string;

  @Index()
  @Column()
  ownerId!: string;

  /** AES-256-GCM ciphertext encoded as `iv:authTag:cipher` (all hex). */
  @Column({ type: 'text' })
  data!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
