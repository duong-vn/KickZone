import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);
  private supabase: SupabaseClient | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  async findAll(query?: {
    search?: string;
    role?: string;
    status?: string;
    page?: string;
    limit?: string;
  }) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.profilesWhereInput = {};

    if (query?.search) {
      where.OR = [
        { full_name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query?.role) {
      where.role = query.role as 'USER' | 'ADMIN';
    }

    if (query?.status) {
      where.status = query.status as 'ACTIVE' | 'INACTIVE';
    }

    const [items, total] = await Promise.all([
      this.prisma.profiles.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.profiles.count({ where }),
    ]);

    return {
      data: items.map((p) => ({
        id: p.id,
        authUserId: p.auth_user_id,
        fullName: p.full_name || 'Chưa cập nhật',
        email: p.email,
        phone: p.phone || '',
        role: p.role,
        roleLabel: p.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng',
        status: p.status,
        avatarUrl: p.avatar_path || undefined,
        createdAt: p.created_at.toISOString().split('T')[0],
        totalBookings: 0,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const profile = await this.prisma.profiles.findUnique({
      where: { id },
      include: {
        bookings: {
          include: { fields: true },
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        reviews: {
          include: { fields: true },
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return {
      id: profile.id,
      fullName: profile.full_name || 'Chưa cập nhật',
      email: profile.email,
      phone: profile.phone || '',
      registeredDate: profile.created_at.toISOString().split('T')[0],
      loginProvider: 'Email',
      status: profile.status,
      avatarUrl:
        profile.avatar_path ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80',
      stats: {
        totalBookings: profile.bookings.length,
        completed: profile.bookings.filter((b) => b.status === 'COMPLETED')
          .length,
        cancelled: profile.bookings.filter((b) => b.status === 'CANCELLED')
          .length,
        pending: profile.bookings.filter((b) => b.status === 'PENDING').length,
      },
      recentBookings: profile.bookings.map((b) => ({
        id: b.id,
        fieldName: b.fields.name,
        fieldLocation: b.fields.address,
        bookingDate: b.start_time.toISOString().split('T')[0],
        timeRange: `${b.start_time.toISOString().substring(11, 16)} - ${b.end_time.toISOString().substring(11, 16)}`,
        status: b.status,
      })),
      recentReviews: profile.reviews.map((r) => ({
        id: r.id,
        fieldName: r.fields.name,
        rating: r.rating,
        content: r.content,
        date: r.created_at.toISOString().split('T')[0],
      })),
    };
  }

  async createUser(dto: CreateUserDto) {
    // 1. Check if email exists in profiles table
    const existingProfile = await this.prisma.profiles.findFirst({
      where: { email: { equals: dto.email, mode: 'insensitive' } },
    });

    if (existingProfile) {
      throw new ConflictException(
        `Email "${dto.email}" đã tồn tại trong hệ thống`,
      );
    }

    if (!this.supabase) {
      throw new InternalServerErrorException(
        'Supabase Admin Service Role Key chưa được cấu hình',
      );
    }

    // 2. Create user in Supabase Auth via Admin API
    const { data: authData, error: authError } =
      await this.supabase.auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
        user_metadata: {
          full_name: dto.fullName,
          name: dto.fullName,
          phone: dto.phone || null,
          ...(dto.avatarUrl && { avatar_url: dto.avatarUrl }),
        },
        ...(dto.status === 'INACTIVE' && { ban_duration: '876000h' }),
      });

    if (authError) {
      this.logger.error(`Supabase create user error: ${authError.message}`);
      if (
        authError.message.includes('already registered') ||
        authError.message.includes('already exists')
      ) {
        throw new ConflictException(
          `Tài khoản với email "${dto.email}" đã tồn tại trên Supabase Auth`,
        );
      }
      throw new BadRequestException(
        `Không thể tạo tài khoản: ${authError.message}`,
      );
    }

    if (!authData.user) {
      throw new InternalServerErrorException(
        'Không nhận được thông tin người dùng từ Supabase Auth',
      );
    }

    // 3. Create profile in database
    const profile = await this.prisma.profiles.create({
      data: {
        auth_user_id: authData.user.id,
        email: dto.email,
        full_name: dto.fullName,
        phone: dto.phone || null,
        avatar_path: dto.avatarUrl || null,
        role: dto.role || 'USER',
        status: dto.status || 'ACTIVE',
      },
    });

    return {
      id: profile.id,
      authUserId: profile.auth_user_id,
      email: profile.email,
      fullName: profile.full_name,
      phone: profile.phone,
      avatarUrl: profile.avatar_path,
      role: profile.role,
      status: profile.status,
      createdAt: profile.created_at.toISOString(),
      updatedAt: profile.updated_at.toISOString(),
    };
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    const profile = await this.prisma.profiles.findUnique({ where: { id } });
    if (!profile) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const updated = await this.prisma.profiles.update({
      where: { id },
      data: { status },
    });

    if (this.supabase && profile.auth_user_id) {
      try {
        if (status === 'INACTIVE') {
          await this.supabase.auth.admin.updateUserById(profile.auth_user_id, {
            ban_duration: '876000h',
          });
        } else {
          await this.supabase.auth.admin.updateUserById(profile.auth_user_id, {
            ban_duration: 'none',
          });
        }
      } catch (err) {
        this.logger.warn(
          `Could not sync ban status to Supabase Auth: ${(err as Error).message}`,
        );
      }
    }

    return updated;
  }

  async updateUser(
    id: string,
    data: {
      fullName?: string;
      phone?: string;
      role?: 'USER' | 'ADMIN';
      status?: 'ACTIVE' | 'INACTIVE';
      avatarPath?: string;
      avatarUrl?: string;
    },
  ) {
    const profile = await this.prisma.profiles.findUnique({ where: { id } });
    if (!profile) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const avatar = data.avatarPath || data.avatarUrl;

    const updated = await this.prisma.profiles.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined && { full_name: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.status !== undefined && { status: data.status }),
        ...(avatar !== undefined && { avatar_path: avatar }),
      },
    });

    if (this.supabase && profile.auth_user_id) {
      try {
        const updatePayload: {
          user_metadata?: Record<string, unknown>;
          ban_duration?: string;
        } = {};

        if (avatar) {
          updatePayload.user_metadata = { avatar_url: avatar };
        }
        if (data.status === 'INACTIVE') {
          updatePayload.ban_duration = '876000h';
        } else if (data.status === 'ACTIVE') {
          updatePayload.ban_duration = 'none';
        }

        if (Object.keys(updatePayload).length > 0) {
          await this.supabase.auth.admin.updateUserById(
            profile.auth_user_id,
            updatePayload,
          );
        }
      } catch (err) {
        this.logger.warn(
          `Could not sync user changes to Supabase Auth: ${(err as Error).message}`,
        );
      }
    }

    return updated;
  }

  async uploadAvatar(id: string, file: Express.Multer.File) {
    const profile = await this.prisma.profiles.findUnique({ where: { id } });
    if (!profile) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const { publicUrl } = await this.storageService.uploadAvatar(file, id);

    const updated = await this.prisma.profiles.update({
      where: { id },
      data: { avatar_path: publicUrl },
    });

    if (this.supabase && profile.auth_user_id) {
      try {
        await this.supabase.auth.admin.updateUserById(profile.auth_user_id, {
          user_metadata: { avatar_url: publicUrl },
        });
      } catch (err) {
        this.logger.warn(
          `Could not sync avatar to Supabase Auth: ${(err as Error).message}`,
        );
      }
    }

    return {
      avatarUrl: publicUrl,
      profile: updated,
    };
  }
}
