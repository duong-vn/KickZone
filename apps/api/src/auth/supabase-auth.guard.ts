import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  type Request,
} from '@nestjs/common';
import { SupabaseAuthService } from './supabase-auth.service.js';
import type { AuthenticatedProfile } from './supabase-auth.service.js';
export type { AuthenticatedProfile } from './supabase-auth.service.js';

type AuthenticatedRequest = Request & {
  profile?: AuthenticatedProfile;
};

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly auth: SupabaseAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<
        AuthenticatedRequest & { headers: { authorization?: string } }
      >();
    const profile = await this.auth.authenticate(request.headers.authorization);

    if (profile.status !== 'ACTIVE') {
      throw new ForbiddenException({
        code: 'ACCOUNT_INACTIVE',
        message: 'This account is inactive.',
      });
    }

    request.profile = profile;
    return true;
  }
}

export function getAuthenticatedProfile(
  request: Request,
): AuthenticatedProfile {
  const profile = (request as AuthenticatedRequest).profile;
  if (!profile) {
    throw new Error('Authenticated profile is missing');
  }
  return profile;
}
