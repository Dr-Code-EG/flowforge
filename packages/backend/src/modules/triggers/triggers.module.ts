import { forwardRef, Module } from '@nestjs/common';

import { TriggersService } from './triggers.service';
import { WorkflowsModule } from '../workflows/workflows.module';
import { EngineModule } from '../engine/engine.module';

@Module({
  imports: [forwardRef(() => WorkflowsModule), forwardRef(() => EngineModule)],
  providers: [TriggersService],
  exports: [TriggersService],
})
export class TriggersModule {}
