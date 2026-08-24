import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { PrismaService } from '../../prisma/prisma.service';
import type { profiles } from '../generated/prisma/client';

@Injectable()
export class AuthService {
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

  async validateToken(token: string): Promise<User> {
    if (!this.supabase) {
      throw new UnauthorizedException('Supabase auth is not configured');
    }

    const { data, error } = await this.supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException(
        'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
      );
    }

    return data.user;
  }

  async resolveProfile(authUser: User): Promise<profiles> {
    const existingProfile = await this.prisma.profiles.findUnique({
      where: { auth_user_id: authUser.id },
    });

    if (existingProfile) {
      if (existingProfile.status !== 'ACTIVE') {
        throw new ForbiddenException(
          'Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt',
        );
      }

      // Update cached email if it changed
      if (authUser.email && existingProfile.email !== authUser.email) {
        return this.prisma.profiles.update({
          where: { id: existingProfile.id },
          data: { email: authUser.email },
        });
      }

      return existingProfile;
    }

    // Idempotently create profile for new user
    const fullName =
      (authUser.user_metadata?.full_name as string) ||
      (authUser.user_metadata?.name as string) ||
      null;
    const phone = (authUser.user_metadata?.phone as string) || null;

    return this.prisma.profiles.create({
      data: {
        auth_user_id: authUser.id,
        email: authUser.email || '',
        full_name: fullName,
        phone,
        role: 'USER',
        status: 'ACTIVE',
      },
    });
  }
}
