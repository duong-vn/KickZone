import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { profiles } from '../generated/prisma/client';
import type { AuthenticatedRequest } from './auth.guard';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): profiles => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user!;
  },
);
