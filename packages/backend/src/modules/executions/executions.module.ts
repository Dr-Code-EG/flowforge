import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Execution } from './execution.entity';
import { ExecutionsService } from './executions.service';
import { ExecutionsController } from './executions.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Execution]), AuthModule],
  providers: [ExecutionsService],
  controllers: [ExecutionsController],
  exports: [ExecutionsService],
})
export class ExecutionsModule {}
