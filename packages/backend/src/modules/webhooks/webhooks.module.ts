import { Module } from '@nestjs/common';

import { WebhooksController } from './webhooks.controller';
import { WorkflowsModule } from '../workflows/workflows.module';
import { EngineModule } from '../engine/engine.module';

@Module({
  imports: [WorkflowsModule, EngineModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
