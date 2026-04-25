import { forwardRef, Module } from '@nestjs/common';

import { EngineService } from './engine.service';
import { NodesModule } from '../nodes/nodes.module';
import { ExecutionsModule } from '../executions/executions.module';
import { CredentialsModule } from '../credentials/credentials.module';

@Module({
  imports: [
    NodesModule,
    forwardRef(() => ExecutionsModule),
    CredentialsModule,
  ],
  providers: [EngineService],
  exports: [EngineService],
})
export class EngineModule {}
