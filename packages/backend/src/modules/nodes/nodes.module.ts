import { Module } from '@nestjs/common';

import { NodesRegistry } from './nodes.registry';
import { NodesController } from './nodes.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [NodesRegistry],
  controllers: [NodesController],
  exports: [NodesRegistry],
})
export class NodesModule {}
