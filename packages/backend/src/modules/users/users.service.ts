import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email: email.toLowerCase() } });
  }

  async getById(id: string): Promise<User> {
    const u = await this.findById(id);
    if (!u) throw new NotFoundException('User not found');
    return u;
  }

  async count(): Promise<number> {
    return this.repo.count();
  }

  async create(data: {
    email: string;
    name: string;
    password: string;
    role?: User['role'];
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10);
    const role = data.role ?? ((await this.count()) === 0 ? 'owner' : 'member');
    const user = this.repo.create({
      email: data.email.toLowerCase().trim(),
      name: data.name.trim(),
      passwordHash,
      role,
    });
    return this.repo.save(user);
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  toPublic(user: User) {
    const { passwordHash: _ignored, ...rest } = user;
    return rest;
  }
}
