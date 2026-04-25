import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserData {
  userId: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as CurrentUserData;
  },
);
