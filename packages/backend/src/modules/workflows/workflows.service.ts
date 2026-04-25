import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  WorkflowConnection,
  WorkflowNode,
  WorkflowSettings,
} from '@flowforge/shared';

import { Workflow } from './workflow.entity';

export interface UpsertWorkflowDto {
  name: string;
  active?: boolean;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  settings?: WorkflowSettings;
  tags?: string[];
}

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(Workflow) private readonly repo: Repository<Workflow>,
  ) {}

  list(ownerId: string) {
    return this.repo.find({
      where: { ownerId },
      order: { updatedAt: 'DESC' },
      select: ['id', 'name', 'active', 'tags', 'updatedAt', 'createdAt'],
    });
  }

  async get(ownerId: string, id: string): Promise<Workflow> {
    const w = await this.repo.findOne({ where: { id, ownerId } });
    if (!w) throw new NotFoundException('Workflow not found');
    return w;
  }

  async getById(id: string): Promise<Workflow> {
    const w = await this.repo.findOne({ where: { id } });
    if (!w) throw new NotFoundException('Workflow not found');
    return w;
  }

  async listAllActive(): Promise<Workflow[]> {
    return this.repo.find({ where: { active: true } });
  }

  async create(ownerId: string, dto: UpsertWorkflowDto) {
    const w = this.repo.create({
      ownerId,
      name: dto.name,
      active: dto.active ?? false,
      nodes: dto.nodes ?? [],
      connections: dto.connections ?? [],
      settings: dto.settings ?? null,
      tags: dto.tags ?? null,
    });
    return this.repo.save(w);
  }

  async update(ownerId: string, id: string, dto: Partial<UpsertWorkflowDto>) {
    const existing = await this.get(ownerId, id);
    Object.assign(existing, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.active !== undefined ? { active: dto.active } : {}),
      ...(dto.nodes !== undefined ? { nodes: dto.nodes } : {}),
      ...(dto.connections !== undefined ? { connections: dto.connections } : {}),
      ...(dto.settings !== undefined ? { settings: dto.settings } : {}),
      ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
    });
    return this.repo.save(existing);
  }

  async remove(ownerId: string, id: string) {
    const r = await this.repo.delete({ id, ownerId });
    if (!r.affected) throw new NotFoundException('Workflow not found');
    return { ok: true };
  }

  async setActive(ownerId: string, id: string, active: boolean) {
    const w = await this.get(ownerId, id);
    w.active = active;
    return this.repo.save(w);
  }
}
