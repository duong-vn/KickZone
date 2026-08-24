import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import {
  getAuthenticatedProfile,
  type AuthenticatedProfile,
} from './supabase-auth.guard.js';

export const CurrentProfile = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedProfile => {
    return getAuthenticatedProfile(context.switchToHttp().getRequest());
  },
);
