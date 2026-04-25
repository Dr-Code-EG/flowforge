import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserData } from '../auth/current-user.decorator';
import { WorkflowsService, UpsertWorkflowDto } from './workflows.service';
import { ExecutionsService } from '../executions/executions.service';
import { EngineService } from '../engine/engine.service';
import { TriggersService } from '../triggers/triggers.service';

@UseGuards(JwtAuthGuard)
@Controller('api/workflows')
export class WorkflowsController {
  constructor(
    private readonly workflows: WorkflowsService,
    private readonly executions: ExecutionsService,
    private readonly engine: EngineService,
    private readonly triggers: TriggersService,
  ) {}

  @Get()
  list(@CurrentUser() user: CurrentUserData) {
    return this.workflows.list(user.userId);
  }

  @Get(':id')
  get(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.workflows.get(user.userId, id);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpsertWorkflowDto,
  ) {
    return this.workflows.create(user.userId, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: Partial<UpsertWorkflowDto>,
  ) {
    const w = await this.workflows.update(user.userId, id, dto);
    // Re-register triggers if the workflow is active
    await this.triggers.refresh(w.id);
    return w;
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    await this.triggers.unregister(id);
    return this.workflows.remove(user.userId, id);
  }

  @Post(':id/activate')
  async activate(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const w = await this.workflows.setActive(user.userId, id, true);
    await this.triggers.refresh(w.id);
    return w;
  }

  @Post(':id/deactivate')
  async deactivate(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    const w = await this.workflows.setActive(user.userId, id, false);
    await this.triggers.unregister(w.id);
    return w;
  }

  /** Run a workflow manually from the editor, optionally with start node + payload. */
  @Post(':id/run')
  async run(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: { startNode?: string; data?: Record<string, unknown> } = {},
  ) {
    const wf = await this.workflows.get(user.userId, id);
    const exec = await this.engine.runWorkflow(wf, {
      mode: 'manual',
      startNodeId: body.startNode,
      input: body.data ? [{ json: body.data }] : undefined,
    });
    return exec;
  }
}
