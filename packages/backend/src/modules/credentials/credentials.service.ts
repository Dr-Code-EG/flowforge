import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Credential } from './credential.entity';
import { EncryptionService } from './encryption.service';

@Injectable()
export class CredentialsService {
  constructor(
    @InjectRepository(Credential)
    private readonly repo: Repository<Credential>,
    private readonly enc: EncryptionService,
  ) {}

  async list(ownerId: string) {
    const items = await this.repo.find({
      where: { ownerId },
      order: { updatedAt: 'DESC' },
    });
    return items.map(({ data: _data, ...rest }) => rest);
  }

  async create(
    ownerId: string,
    input: { name: string; type: string; data: Record<string, unknown> },
  ) {
    const cred = this.repo.create({
      ownerId,
      name: input.name,
      type: input.type,
      data: this.enc.encryptObject(input.data),
    });
    const saved = await this.repo.save(cred);
    const { data: _data, ...rest } = saved;
    return rest;
  }

  async update(
    ownerId: string,
    id: string,
    input: { name?: string; data?: Record<string, unknown> },
  ) {
    const existing = await this.repo.findOne({ where: { id, ownerId } });
    if (!existing) throw new NotFoundException('Credential not found');
    if (input.name !== undefined) existing.name = input.name;
    if (input.data !== undefined) existing.data = this.enc.encryptObject(input.data);
    const saved = await this.repo.save(existing);
    const { data: _data, ...rest } = saved;
    return rest;
  }

  async remove(ownerId: string, id: string) {
    const r = await this.repo.delete({ id, ownerId });
    if (!r.affected) throw new NotFoundException('Credential not found');
    return { ok: true };
  }

  async getDecrypted<T = Record<string, unknown>>(
    ownerId: string,
    id: string,
  ): Promise<T> {
    const c = await this.repo.findOne({ where: { id, ownerId } });
    if (!c) throw new NotFoundException('Credential not found');
    return this.enc.decryptObject<T>(c.data);
  }

  /** Lookup credential data by id without owner check (used by execution engine). */
  async getDecryptedById<T = Record<string, unknown>>(id: string): Promise<T> {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Credential not found');
    return this.enc.decryptObject<T>(c.data);
  }
}
