import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExecutionsService } from './executions.service';

@UseGuards(JwtAuthGuard)
@Controller('api/executions')
export class ExecutionsController {
  constructor(private readonly executions: ExecutionsService) {}

  @Get()
  list(
    @Query('workflowId') workflowId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.executions.list({
      workflowId,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.executions.get(id);
  }
}
