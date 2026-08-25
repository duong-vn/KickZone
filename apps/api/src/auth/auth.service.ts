import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import type { profiles } from '../generated/prisma/client';
import { formatBusinessDate, formatBusinessTime } from '../bookings/booking-rules';

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
    const shouldFetchBookings =
      filterType === 'ALL' || filterType === 'BOOKING';
    const shouldFetchReviews = filterType === 'ALL' || filterType === 'REVIEW';
    const shouldFetchFavorites =
      filterType === 'ALL' || filterType === 'FAVORITE';
    const fetchLimit = Math.max(page * limit * 2, 50);

    const [
      bookingsList,
      reviewsList,
      favoritesList,
      newFieldsList,
      newVouchersList,
      bookingCount,
      reviewCount,
      favoriteCount,
    ] = await Promise.all([
      shouldFetchBookings
        ? this.prisma.bookings.findMany({
            where: { user_id: userId },
            include: {
              fields: {
                select: { id: true, name: true, slug: true, address: true },
              },
            },
            orderBy: [{ updated_at: 'desc' }, { created_at: 'desc' }],
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
      filterType === 'ALL' && this.prisma.fields?.findMany
        ? this.prisma.fields.findMany({
            where: { deleted_at: null, status: 'ACTIVE' },
            orderBy: { created_at: 'desc' },
            take: 3,
            select: {
              id: true,
              name: true,
              slug: true,
              address: true,
              created_at: true,
            },
          })
        : Promise.resolve([]),
      filterType === 'ALL' && this.prisma.vouchers?.findMany
        ? this.prisma.vouchers.findMany({
            where: { is_active: true },
            orderBy: { created_at: 'desc' },
            take: 3,
            select: {
              id: true,
              code: true,
              discount_type: true,
              value: true,
              created_at: true,
            },
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
      let title = `Đã tạo yêu cầu đặt sân #${b.code}`;
      const timeRangeStr =
        b.start_time && b.end_time
          ? ` (${formatBusinessTime(b.start_time)} - ${formatBusinessTime(b.end_time)}, ${formatBusinessDate(b.start_time)})`
          : '';
      let description = `Yêu cầu đặt sân ${b.fields?.name || 'sân bóng'}${timeRangeStr} đang chờ quản trị viên xác nhận.`;
      const activityTime = b.updated_at || b.created_at;

      if (b.status === 'CONFIRMED') {
        type = 'BOOKING_CONFIRMED';
        title = `Đơn #${b.code} đã được xác nhận`;
        description = `Đơn đặt sân ${b.fields?.name || 'sân bóng'}${timeRangeStr} đã được quản trị viên phê duyệt thành công.`;
      } else if (b.status === 'CANCELLED') {
        type = 'BOOKING_CANCELLED';
        title = `Đơn #${b.code} đã được hủy`;
        description = `Đơn đặt sân ${b.fields?.name || 'sân bóng'}${timeRangeStr} đã hủy thành công.${b.cancellation_reason ? ` Lý do: ${b.cancellation_reason}` : ''}`;
      } else if (b.status === 'REJECTED') {
        type = 'BOOKING_REJECTED';
        title = `Đơn #${b.code} đã bị từ chối`;
        description = `Yêu cầu đặt sân ${b.fields?.name || 'sân bóng'}${timeRangeStr} đã bị từ chối.${b.rejection_reason ? ` Lý do: ${b.rejection_reason}` : ''}`;
      } else if (b.status === 'COMPLETED') {
        type = 'BOOKING_COMPLETED';
        title = `Đơn #${b.code} đã hoàn thành`;
        description = `Trận đấu tại sân ${b.fields?.name || 'sân bóng'}${timeRangeStr} đã kết thúc. Hãy để lại đánh giá cho sân nhé!`;
      }

      activities.push({
        id: `booking-${b.id}`,
        type,
        title,
        description,
        time: activityTime.toISOString(),
        timestamp: activityTime,
        code: b.code,
        linkHref: `/bookings/${b.id}`,
        linkText: 'Xem chi tiết đơn',
      });
    }

    // Map new fields
    if (Array.isArray(newFieldsList)) {
      for (const f of newFieldsList) {
        activities.push({
          id: `field-${f.id}`,
          type: 'NEW_FIELD',
          title: `Sân mới ra mắt: ${f.name}`,
          description: `Sân bóng ${f.name} đã chính thức có mặt tại ${f.address}. Khám phá và đặt sân ngay!`,
          time: f.created_at.toISOString(),
          timestamp: f.created_at,
          linkHref: `/fields/${f.slug || f.id}`,
          linkText: 'Xem sân bóng',
        });
      }
    }

    // Map new vouchers
    if (Array.isArray(newVouchersList)) {
      for (const v of newVouchersList) {
        const discountText =
          v.discount_type === 'PERCENT'
            ? `${v.value}%`
            : `${Number(v.value).toLocaleString('vi-VN')}đ`;
        activities.push({
          id: `voucher-${v.id}`,
          type: 'NEW_VOUCHER',
          title: `Ưu đãi mới: Mã giảm giá ${v.code}`,
          description: `Nhận ngay ưu đãi giảm ${discountText} cho các lượt đặt sân khi áp dụng mã ${v.code}. Đặt sân ngay hôm nay!`,
          time: v.created_at.toISOString(),
          timestamp: v.created_at,
          linkHref: '/fields',
          linkText: 'Đặt sân ngay',
        });
      }
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
        : bookingCount +
          reviewCount +
          favoriteCount +
          (newFieldsList?.length || 0) +
          (newVouchersList?.length || 0);

    // Slice for requested page
    const startIndex = (page - 1) * limit;
    const paginatedItems = activities
      .slice(startIndex, startIndex + limit)
      .map((item) => {
        const { timestamp, ...rest } = item;
        void timestamp;
        return rest;
      });

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
