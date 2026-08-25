import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
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

  async updateProfile(
    userId: string,
    dto: { fullName?: string; phone?: string },
  ): Promise<profiles> {
    return this.prisma.profiles.update({
      where: { id: userId },
      data: {
        ...(dto.fullName !== undefined && {
          full_name: dto.fullName.trim() || null,
        }),
        ...(dto.phone !== undefined && {
          phone: dto.phone.trim() || null,
        }),
      },
    });
  }

  async getUserActivities(
    userId: string,
    query?: {
      search?: string;
      type?: string;
      sort?: string;
      page?: string | number;
      limit?: string | number;
    },
  ) {
    const rawPage = Number(query?.page);
    const rawLimit = Number(query?.limit);
    const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
    const limit =
      Number.isInteger(rawLimit) && rawLimit >= 1
        ? Math.min(rawLimit, 100)
        : 20;

    const filterType = query?.type?.toUpperCase() || 'ALL';
    const shouldFetchBookings = filterType === 'ALL' || filterType === 'BOOKING';
    const shouldFetchReviews = filterType === 'ALL' || filterType === 'REVIEW';
    const shouldFetchFavorites = filterType === 'ALL' || filterType === 'FAVORITE';
    const fetchLimit = Math.max(page * limit * 2, 50);

    const [
      bookingsList,
      reviewsList,
      favoritesList,
      bookingCount,
      reviewCount,
      favoriteCount,
    ] = await Promise.all([
      shouldFetchBookings
        ? this.prisma.bookings.findMany({
            where: { user_id: userId },
            include: {
              fields: {
                select: { id: true, name: true, slug: true },
              },
            },
            orderBy: { created_at: 'desc' },
            take: fetchLimit,
          })
        : Promise.resolve([]),
      shouldFetchReviews
        ? this.prisma.reviews.findMany({
            where: { user_id: userId },
            include: {
              fields: {
                select: { id: true, name: true, slug: true },
              },
            },
            orderBy: { created_at: 'desc' },
            take: fetchLimit,
          })
        : Promise.resolve([]),
      shouldFetchFavorites
        ? this.prisma.favorites.findMany({
            where: { user_id: userId, fields: { deleted_at: null } },
            include: {
              fields: {
                select: { id: true, name: true, slug: true },
              },
            },
            orderBy: { created_at: 'desc' },
            take: fetchLimit,
          })
        : Promise.resolve([]),
      shouldFetchBookings
        ? this.prisma.bookings.count({ where: { user_id: userId } })
        : Promise.resolve(0),
      shouldFetchReviews
        ? this.prisma.reviews.count({ where: { user_id: userId } })
        : Promise.resolve(0),
      shouldFetchFavorites
        ? this.prisma.favorites.count({
            where: { user_id: userId, fields: { deleted_at: null } },
          })
        : Promise.resolve(0),
    ]);

    let activities: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      time: string;
      timestamp: Date;
      code?: string;
      linkHref: string;
      linkText: string;
    }> = [];

    // Map bookings
    for (const b of bookingsList) {
      let type = 'BOOKING_CREATED';
      let title = 'Đã tạo yêu cầu đặt sân';
      let description = `Bạn đã gửi yêu cầu đặt ${b.fields.name}.`;

      if (b.status === 'CONFIRMED') {
        type = 'BOOKING_CONFIRMED';
        title = 'Đơn đặt sân đã được xác nhận';
        description = `Đơn đặt tại ${b.fields.name} đã được quản trị viên duyệt.`;
      } else if (b.status === 'CANCELLED') {
        type = 'BOOKING_CANCELLED';
        title = 'Đã hủy đơn đặt sân';
        description = `Bạn đã hủy đơn đặt sân tại ${b.fields.name}.`;
      } else if (b.status === 'REJECTED') {
        type = 'BOOKING_REJECTED';
        title = 'Đơn đặt sân bị từ chối';
        description = `Yêu cầu đặt sân tại ${b.fields.name} đã bị từ chối.`;
      } else if (b.status === 'COMPLETED') {
        type = 'BOOKING_COMPLETED';
        title = 'Hoàn thành trận đấu';
        description = `Trận đấu tại ${b.fields.name} đã hoàn tất.`;
      }

      activities.push({
        id: `booking-${b.id}`,
        type,
        title,
        description,
        time: b.created_at.toISOString(),
        timestamp: b.created_at,
        code: b.code,
        linkHref: `/bookings/${b.id}`,
        linkText: 'Xem chi tiết đơn',
      });
    }

    // Map reviews
    for (const r of reviewsList) {
      activities.push({
        id: `review-${r.id}`,
        type: 'REVIEW',
        title: 'Đã gửi đánh giá sân bóng',
        description: `Bạn đã đánh giá ${r.rating} sao cho ${r.fields.name}: "${r.content}"`,
        time: r.created_at.toISOString(),
        timestamp: r.created_at,
        linkHref: `/fields/${r.field_id}`,
        linkText: 'Xem thông tin sân',
      });
    }

    // Map favorites
    for (const f of favoritesList) {
      activities.push({
        id: `fav-${f.id}`,
        type: 'FAVORITE',
        title: 'Đã thêm vào danh sách yêu thích',
        description: `Bạn đã lưu ${f.fields.name} vào danh sách sân bóng yêu thích của mình.`,
        time: f.created_at.toISOString(),
        timestamp: f.created_at,
        linkHref: `/fields/${f.field_id}`,
        linkText: 'Xem thông tin sân',
      });
    }

    // Search filter
    if (query?.search && query.search.trim()) {
      const keyword = query.search.trim().toLowerCase();
      activities = activities.filter(
        (a) =>
          a.title.toLowerCase().includes(keyword) ||
          a.description.toLowerCase().includes(keyword) ||
          (a.code && a.code.toLowerCase().includes(keyword)),
      );
    }

    // Sort order
    const isAscending = query?.sort === 'oldest' || query?.sort === 'asc';
    if (isAscending) {
      activities.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    } else {
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    const total =
      query?.search && query.search.trim()
        ? activities.length
        : bookingCount + reviewCount + favoriteCount;

    // Slice for requested page
    const startIndex = (page - 1) * limit;
    const paginatedItems = activities
      .slice(startIndex, startIndex + limit)
      .map(({ timestamp: _, ...rest }) => rest);

    return {
      data: paginatedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}
