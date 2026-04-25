import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  ExecutionData,
  ExecutionMode,
  ExecutionStatus,
} from '@flowforge/shared';

import { Execution } from './execution.entity';

@Injectable()
export class ExecutionsService {
  constructor(
    @InjectRepository(Execution)
    private readonly repo: Repository<Execution>,
  ) {}

  list(filter: { workflowId?: string; limit?: number } = {}) {
    return this.repo.find({
      where: filter.workflowId ? { workflowId: filter.workflowId } : {},
      order: { startedAt: 'DESC' },
      take: filter.limit ?? 50,
    });
  }

  async get(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Execution not found');
    return e;
  }

  create(input: {
    workflowId: string;
    workflowName: string;
    mode: ExecutionMode;
    status?: ExecutionStatus;
    data?: ExecutionData;
  }) {
    const e = this.repo.create({
      workflowId: input.workflowId,
      workflowName: input.workflowName,
      mode: input.mode,
      status: input.status ?? 'running',
      startedAt: new Date().toISOString(),
      data: input.data ?? { nodes: {}, trace: [] },
    });
    return this.repo.save(e);
  }

  update(
    id: string,
    patch: Partial<
      Pick<Execution, 'status' | 'data' | 'finishedAt' | 'error'>
    >,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.repo.update(id, patch as any);
  }
}
