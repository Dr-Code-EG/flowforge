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
import { CredentialsService } from './credentials.service';

@UseGuards(JwtAuthGuard)
@Controller('api/credentials')
export class CredentialsController {
  constructor(private readonly creds: CredentialsService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserData) {
    return this.creds.list(user.userId);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { name: string; type: string; data: Record<string, unknown> },
  ) {
    return this.creds.create(user.userId, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() body: { name?: string; data?: Record<string, unknown> },
  ) {
    return this.creds.update(user.userId, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.creds.remove(user.userId, id);
  }
}
