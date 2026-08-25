import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleLoginDto } from './dto/google-login.dto';
import { FacebookLoginDto } from './dto/facebook-login.dto';

export interface OAuthUserProfile {
  provider: 'google' | 'facebook';
  providerId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface OAuthLoginResponse {
  user: {
    id: string;
    authUserId: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    role: string;
    status: string;
  };
  accessToken?: string;
  message: string;
}

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private supabase: SupabaseClient | null = null;

  constructor(private readonly prisma: PrismaService) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  async loginWithGoogle(dto: GoogleLoginDto): Promise<OAuthLoginResponse> {
    if (!dto.idToken && !dto.accessToken && !dto.code) {
      throw new BadRequestException(
        'Vui lòng cung cấp mã xác thực từ Google (idToken, accessToken hoặc code).',
      );
    }

    let googleProfile: OAuthUserProfile | null = null;

    // 1. Verify via ID Token (JWT Token Info)
    if (dto.idToken) {
      googleProfile = await this.fetchGoogleProfileByIdToken(dto.idToken);
    }

    // 2. Fallback: Verify via Access Token
    if (!googleProfile && dto.accessToken) {
      googleProfile = await this.fetchGoogleProfileByAccessToken(
        dto.accessToken,
      );
    }

    // 3. Fallback: Exchange Code if configured
    if (!googleProfile && dto.code) {
      googleProfile = await this.fetchGoogleProfileByCode(dto.code);
    }

    if (!googleProfile || !googleProfile.email) {
      throw new UnauthorizedException(
        'Không thể xác thực danh tính từ Google hoặc tài khoản không có email.',
      );
    }

    return this.provisionOrLoginUser(googleProfile);
  }

  async loginWithFacebook(dto: FacebookLoginDto): Promise<OAuthLoginResponse> {
    if (!dto.accessToken && !dto.code) {
      throw new BadRequestException(
        'Vui lòng cung cấp mã xác thực từ Facebook (accessToken hoặc code).',
      );
    }

    let fbProfile: OAuthUserProfile | null = null;

    if (dto.accessToken) {
      fbProfile = await this.fetchFacebookProfileByAccessToken(dto.accessToken);
    } else if (dto.code) {
      fbProfile = await this.fetchFacebookProfileByCode(dto.code);
    }

    if (!fbProfile || !fbProfile.email) {
      throw new UnauthorizedException(
        'Không thể xác thực danh tính từ Facebook hoặc không thể truy cập email.',
      );
    }

    return this.provisionOrLoginUser(fbProfile);
  }

  private async fetchGoogleProfileByIdToken(
    idToken: string,
  ): Promise<OAuthUserProfile | null> {
    try {
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
        { signal: AbortSignal.timeout(5000) },
      );

      if (!response.ok) return null;

      const data = (await response.json()) as {
        email?: string;
        name?: string;
        picture?: string;
        sub?: string;
      };

      if (!data.email) return null;

      return {
        provider: 'google',
        providerId: data.sub || '',
        email: data.email.toLowerCase().trim(),
        name: data.name,
        avatarUrl: data.picture,
      };
    } catch (err) {
      this.logger.warn(`Google tokeninfo error: ${String(err)}`);
      return null;
    }
  }

  private async fetchGoogleProfileByAccessToken(
    accessToken: string,
  ): Promise<OAuthUserProfile | null> {
    try {
      const response = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: AbortSignal.timeout(5000),
        },
      );

      if (!response.ok) return null;

      const data = (await response.json()) as {
        email?: string;
        name?: string;
        picture?: string;
        sub?: string;
      };

      if (!data.email) return null;

      return {
        provider: 'google',
        providerId: data.sub || '',
        email: data.email.toLowerCase().trim(),
        name: data.name,
        avatarUrl: data.picture,
      };
    } catch (err) {
      this.logger.warn(`Google userinfo error: ${String(err)}`);
      return null;
    }
  }

  private async fetchGoogleProfileByCode(
    code: string,
  ): Promise<OAuthUserProfile | null> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;

    if (!clientId || !clientSecret) return null;

    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!tokenRes.ok) return null;
      const tokens = (await tokenRes.json()) as {
        id_token?: string;
        access_token?: string;
      };
      if (tokens.id_token) {
        return this.fetchGoogleProfileByIdToken(tokens.id_token);
      }
      if (tokens.access_token) {
        return this.fetchGoogleProfileByAccessToken(tokens.access_token);
      }
      return null;
    } catch (err) {
      this.logger.warn(`Google exchange code error: ${String(err)}`);
      return null;
    }
  }

  private async fetchFacebookProfileByAccessToken(
    accessToken: string,
  ): Promise<OAuthUserProfile | null> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`,
        { signal: AbortSignal.timeout(5000) },
      );

      if (!response.ok) return null;

      const data = (await response.json()) as {
        id?: string;
        name?: string;
        email?: string;
        picture?: { data?: { url?: string } };
      };

      const email =
        data.email?.toLowerCase().trim() ||
        (data.id ? `fb_${data.id}@facebook.user` : '');
      if (!email) return null;

      return {
        provider: 'facebook',
        providerId: data.id || '',
        email,
        name: data.name,
        avatarUrl: data.picture?.data?.url,
      };
    } catch (err) {
      this.logger.warn(`Facebook graph error: ${String(err)}`);
      return null;
    }
  }

  private async fetchFacebookProfileByCode(
    code: string,
  ): Promise<OAuthUserProfile | null> {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri =
      process.env.FACEBOOK_REDIRECT_URI ||
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;

    if (!appId || !appSecret) return null;

    try {
      const tokenRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${encodeURIComponent(code)}`,
        { signal: AbortSignal.timeout(5000) },
      );

      if (!tokenRes.ok) return null;
      const tokens = (await tokenRes.json()) as { access_token?: string };
      if (tokens.access_token) {
        return this.fetchFacebookProfileByAccessToken(tokens.access_token);
      }
      return null;
    } catch (err) {
      this.logger.warn(`Facebook exchange code error: ${String(err)}`);
      return null;
    }
  }

  private async provisionOrLoginUser(
    oAuthUser: OAuthUserProfile,
  ): Promise<OAuthLoginResponse> {
    const email = oAuthUser.email.toLowerCase().trim();

    // 1. Look up existing profile
    let profile = await this.prisma.profiles.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });

    if (profile) {
      if (profile.status === 'INACTIVE') {
        throw new ForbiddenException(
          'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
        );
      }

      // Update avatar or full name if missing
      const updateData: { full_name?: string; avatar_path?: string } = {};
      if (!profile.full_name && oAuthUser.name) {
        updateData.full_name = oAuthUser.name;
      }
      if (!profile.avatar_path && oAuthUser.avatarUrl) {
        updateData.avatar_path = oAuthUser.avatarUrl;
      }

      if (Object.keys(updateData).length > 0) {
        profile = await this.prisma.profiles.update({
          where: { id: profile.id },
          data: updateData,
        });
      }
    } else {
      // 2. Create user in Supabase Auth & Prisma
      let authUserId = crypto.randomUUID() as string;

      if (this.supabase) {
        try {
          const { data: createdUser, error: authError } =
            await this.supabase.auth.admin.createUser({
              email,
              email_confirm: true,
              user_metadata: {
                full_name: oAuthUser.name,
                avatar_url: oAuthUser.avatarUrl,
                provider: oAuthUser.provider,
              },
            });

          if (createdUser?.user?.id) {
            authUserId = createdUser.user.id;
          } else if (authError) {
            this.logger.warn(`Supabase createUser note: ${authError.message}`);
          }
        } catch (err) {
          this.logger.warn(`Supabase admin error: ${String(err)}`);
        }
      }

      // Insert new profile
      profile = await this.prisma.profiles.create({
        data: {
          auth_user_id: authUserId,
          email,
          full_name: oAuthUser.name || null,
          avatar_path: oAuthUser.avatarUrl || null,
          role: 'USER',
          status: 'ACTIVE',
        },
      });
    }

    return {
      user: {
        id: profile.id,
        authUserId: profile.auth_user_id,
        email: profile.email,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_path,
        role: profile.role,
        status: profile.status,
      },
      message: 'Đăng nhập thành công.',
    };
  }
}
