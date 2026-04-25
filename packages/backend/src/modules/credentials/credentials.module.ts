import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Credential } from './credential.entity';
import { CredentialsService } from './credentials.service';
import { CredentialsController } from './credentials.controller';
import { EncryptionService } from './encryption.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Credential]), AuthModule],
  providers: [CredentialsService, EncryptionService],
  controllers: [CredentialsController],
  exports: [CredentialsService, EncryptionService],
})
export class CredentialsModule {}
