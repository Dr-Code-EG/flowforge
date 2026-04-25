import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: { email: string; password: string; name: string }) {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const user = await this.users.create(input);
    return this.issueToken(user.id, user.email, user.role);
  }

  async login(input: { email: string; password: string }) {
    const user = await this.users.findByEmail(input.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await this.users.verifyPassword(user, input.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return this.issueToken(user.id, user.email, user.role);
  }

  async me(userId: string) {
    const u = await this.users.getById(userId);
    return this.users.toPublic(u);
  }

  private async issueToken(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role };
    const token = await this.jwt.signAsync(payload);
    const user = await this.users.getById(userId);
    return { token, user: this.users.toPublic(user) };
  }
}
