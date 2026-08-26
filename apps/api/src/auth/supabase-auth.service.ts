import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  user_metadata?: {
    avatar_url?: string;
    picture?: string;
    full_name?: string;
    name?: string;
    [key: string]: unknown;
  };
  identities?: Array<{
    provider?: string;
    identity_data?: {
      avatar_url?: string;
      picture?: string;
      full_name?: string;
      name?: string;
      [key: string]: unknown;
    };
  }>;
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
        signal: AbortSignal.timeout(12000),
      });
    } catch (err: unknown) {
      this.logger.error(
        `Failed to reach Supabase Auth (${url}): ${err instanceof Error ? err.message : String(err)}`,
      );
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

    // Extract OAuth avatar and name from user_metadata or identities (Google, Facebook, etc.)
    const metaAvatar =
      (typeof providerUser.user_metadata?.avatar_url === 'string' &&
        providerUser.user_metadata.avatar_url.trim()) ||
      (typeof providerUser.user_metadata?.picture === 'string' &&
        providerUser.user_metadata.picture.trim()) ||
      (typeof providerUser.identities?.[0]?.identity_data?.avatar_url ===
        'string' &&
        providerUser.identities[0].identity_data.avatar_url.trim()) ||
      (typeof providerUser.identities?.[0]?.identity_data?.picture ===
        'string' &&
        providerUser.identities[0].identity_data.picture.trim()) ||
      undefined;

    const metaName =
      (typeof providerUser.user_metadata?.full_name === 'string' &&
        providerUser.user_metadata.full_name.trim()) ||
      (typeof providerUser.user_metadata?.name === 'string' &&
        providerUser.user_metadata.name.trim()) ||
      (typeof providerUser.identities?.[0]?.identity_data?.full_name ===
        'string' &&
        providerUser.identities[0].identity_data.full_name.trim()) ||
      (typeof providerUser.identities?.[0]?.identity_data?.name === 'string' &&
        providerUser.identities[0].identity_data.name.trim()) ||
      undefined;

    const existingProfile = await this.prisma.profiles.findUnique({
      where: { auth_user_id: providerUser.id },
      select: {
        id: true,
        auth_user_id: true,
        email: true,
        role: true,
        status: true,
        avatar_path: true,
        full_name: true,
      },
    });

    let profile: {
      id: string;
      auth_user_id: string;
      email: string;
      role: user_role;
      status: user_status;
    };

    if (!existingProfile) {
      profile = await this.prisma.profiles.create({
        data: {
          auth_user_id: providerUser.id,
          email,
          ...(metaName && { full_name: metaName }),
          ...(metaAvatar && { avatar_path: metaAvatar }),
          role: 'USER',
          status: 'ACTIVE',
        },
        select: {
          id: true,
          auth_user_id: true,
          email: true,
          role: true,
          status: true,
        },
      });
    } else {
      const updateData: {
        email: string;
        avatar_path?: string;
        full_name?: string;
      } = { email };

      // Sync avatar if existing is empty or if updated OAuth avatar is provided
      if (
        metaAvatar &&
        (!existingProfile.avatar_path ||
          existingProfile.avatar_path.startsWith('http'))
      ) {
        updateData.avatar_path = metaAvatar;
      }
      if (metaName && !existingProfile.full_name) {
        updateData.full_name = metaName;
      }

      profile = await this.prisma.profiles.update({
        where: { auth_user_id: providerUser.id },
        data: updateData,
        select: {
          id: true,
          auth_user_id: true,
          email: true,
          role: true,
          status: true,
        },
      });
    }

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
