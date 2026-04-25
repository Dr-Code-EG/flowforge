import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Workflow } from './workflow.entity';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { AuthModule } from '../auth/auth.module';
import { ExecutionsModule } from '../executions/executions.module';
import { EngineModule } from '../engine/engine.module';
import { TriggersModule } from '../triggers/triggers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workflow]),
    AuthModule,
    forwardRef(() => ExecutionsModule),
    forwardRef(() => EngineModule),
    forwardRef(() => TriggersModule),
  ],
  providers: [WorkflowsService],
  controllers: [WorkflowsController],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
