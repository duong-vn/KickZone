import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { user_role, user_status } from '../generated/prisma/enums.js';

export interface AuthenticatedProfile {
  id: string;
  authUserId: string;
  email: string;
  role: user_role;
  status: user_status;
}

interface SupabaseUserResponse {
  id?: unknown;
  email?: unknown;
}

@Injectable()
export class SupabaseAuthService {
  private readonly logger = new Logger(SupabaseAuthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async authenticate(
    authorizationHeader: string | undefined,
  ): Promise<AuthenticatedProfile> {
    const token = this.getBearerToken(authorizationHeader);
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      this.logger.error('Supabase server authentication is not configured');
      throw new ServiceUnavailableException({
        code: 'AUTH_PROVIDER_UNAVAILABLE',
        message: 'Authentication service is unavailable.',
      });
    }

    let response: Response;
    try {
      response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      throw new ServiceUnavailableException({
        code: 'AUTH_PROVIDER_UNAVAILABLE',
        message: 'Authentication service is unavailable.',
      });
    }

    if (!response.ok) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID',
        message: 'Invalid authentication token.',
      });
    }

    let providerUser: SupabaseUserResponse;
    try {
      providerUser = (await response.json()) as SupabaseUserResponse;
    } catch {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID',
        message: 'Invalid authentication response.',
      });
    }

    if (
      typeof providerUser.id !== 'string' ||
      !this.isUuid(providerUser.id) ||
      typeof providerUser.email !== 'string' ||
      !providerUser.email.trim()
    ) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID',
        message: 'Authenticated user is invalid.',
      });
    }

    const email = providerUser.email.trim().toLowerCase();
    const profile = await this.prisma.profiles.upsert({
      where: { auth_user_id: providerUser.id },
      create: {
        auth_user_id: providerUser.id,
        email,
      },
      update: { email },
      select: {
        id: true,
        auth_user_id: true,
        email: true,
        role: true,
        status: true,
      },
    });

    return {
      id: profile.id,
      authUserId: profile.auth_user_id,
      email: profile.email,
      role: profile.role,
      status: profile.status,
    };
  }

  private getBearerToken(header: string | undefined): string {
    const match = header?.match(/^Bearer\s+(\S+)$/i);
    if (!match) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message: 'A Bearer token is required.',
      });
    }

    return match[1];
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }
}
