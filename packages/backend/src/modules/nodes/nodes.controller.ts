import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NodesRegistry } from './nodes.registry';

@UseGuards(JwtAuthGuard)
@Controller('api/nodes')
export class NodesController {
  constructor(private readonly nodes: NodesRegistry) {}

  @Get('types')
  list() {
    return this.nodes.list();
  }
}
