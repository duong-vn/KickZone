import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { booking_status } from '../../generated/prisma/client';
import { formatBusinessTime } from '../../bookings/booking-rules';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const startOfToday = new Date(`${todayStr}T00:00:00+07:00`);
    const endOfToday = new Date(`${todayStr}T23:59:59.999+07:00`);

    const [
      totalBookings,
      pendingCount,
      confirmedCount,
      completedCount,
      activeFieldsCount,
      totalUsersCount,
      revenueResult,
      recentBookings,
      todayBookings,
      recentUsers,
      recentReviews,
    ] = await Promise.all([
      this.prisma.bookings.count(),
      this.prisma.bookings.count({
        where: { status: booking_status.PENDING },
      }),
      this.prisma.bookings.count({
        where: { status: booking_status.CONFIRMED },
      }),
      this.prisma.bookings.count({
        where: { status: booking_status.COMPLETED },
      }),
      this.prisma.fields.count({
        where: { status: 'ACTIVE', deleted_at: null },
      }),
      this.prisma.profiles.count({
        where: { role: 'USER' },
      }),
      this.prisma.bookings.aggregate({
        _sum: { final_price: true },
        where: {
          status: {
            in: [booking_status.CONFIRMED, booking_status.COMPLETED],
          },
        },
      }),
      this.prisma.bookings.findMany({
        take: 10,
        orderBy: { updated_at: 'desc' },
        include: {
          profiles: { select: { full_name: true, phone: true, email: true } },
          fields: { select: { name: true } },
        },
      }),
      this.prisma.bookings.findMany({
        where: {
          start_time: {
            gte: startOfToday,
            lte: endOfToday,
          },
          status: {
            in: [
              booking_status.PENDING,
              booking_status.CONFIRMED,
              booking_status.COMPLETED,
            ],
          },
        },
        orderBy: { start_time: 'asc' },
        include: {
          profiles: { select: { full_name: true, phone: true } },
          fields: {
            select: {
              name: true,
              field_types: { select: { name: true } },
            },
          },
        },
      }),
      this.prisma.profiles.findMany({
        take: 5,
        where: { role: 'USER' },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          full_name: true,
          email: true,
          created_at: true,
        },
      }),
      this.prisma.reviews.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          profiles: { select: { full_name: true, email: true } },
          fields: { select: { name: true } },
        },
      }),
    ]);

    const activities: Array<{
      id: string;
      type:
        | 'NEW_BOOKING'
        | 'CANCEL_BOOKING'
        | 'CONFIRM_BOOKING'
        | 'REJECT_BOOKING'
        | 'NEW_USER'
        | 'NEW_REVIEW';
      title: string;
      subject: string;
      timestamp: string;
    }> = [];

    for (const b of recentBookings) {
      const customer = b.profiles.full_name || b.profiles.email || 'Khách hàng';
      if (b.status === booking_status.CANCELLED) {
        activities.push({
          id: `act-cancel-${b.id}`,
          type: 'CANCEL_BOOKING',
          title: `đã hủy đơn ${b.code}`,
          subject: customer,
          timestamp: b.updated_at.toISOString(),
        });
      } else if (b.status === booking_status.CONFIRMED) {
        activities.push({
          id: `act-confirm-${b.id}`,
          type: 'CONFIRM_BOOKING',
          title: `đã được xác nhận (${b.fields.name})`,
          subject: `Đơn ${b.code}`,
          timestamp: b.updated_at.toISOString(),
        });
      } else if (b.status === booking_status.REJECTED) {
        activities.push({
          id: `act-reject-${b.id}`,
          type: 'REJECT_BOOKING',
          title: `đã bị từ chối`,
          subject: `Đơn ${b.code}`,
          timestamp: b.updated_at.toISOString(),
        });
      } else {
        activities.push({
          id: `act-book-${b.id}`,
          type: 'NEW_BOOKING',
          title: `đã đặt ${b.fields.name}`,
          subject: customer,
          timestamp: b.created_at.toISOString(),
        });
      }
    }

    for (const u of recentUsers) {
      activities.push({
        id: `act-user-${u.id}`,
        type: 'NEW_USER',
        title: 'đăng ký tài khoản',
        subject: u.full_name || u.email,
        timestamp: u.created_at.toISOString(),
      });
    }

    if (recentReviews && Array.isArray(recentReviews)) {
      for (const r of recentReviews) {
        const reviewer =
          r.profiles?.full_name || r.profiles?.email || 'Khách hàng';
        activities.push({
          id: `act-review-${r.id}`,
          type: 'NEW_REVIEW',
          title: `đã đánh giá ${r.rating}★ cho ${r.fields?.name || 'sân'}`,
          subject: reviewer,
          timestamp: r.created_at.toISOString(),
        });
      }
    }

    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return {
      totalRevenue: revenueResult._sum.final_price || 0,
      totalBookings,
      pendingBookingsCount: pendingCount,
      confirmedBookingsCount: confirmedCount,
      completedBookingsCount: completedCount,
      activeFieldsCount,
      totalUsersCount,
      todaySchedule: todayBookings.map((b) => ({
        id: b.id,
        code: b.code,
        timeSlot: `${formatBusinessTime(b.start_time)} - ${formatBusinessTime(b.end_time)}`,
        courtName: b.fields.name,
        fieldType: b.fields.field_types?.name || 'Sân bóng',
        customerName: b.profiles.full_name || 'Khách hàng',
        customerPhone: b.profiles.phone || '',
        status: b.status,
        isPending: b.status === booking_status.PENDING,
      })),
      recentActivities: activities.slice(0, 8),
      recentBookings: recentBookings.slice(0, 5).map((b) => ({
        id: b.id,
        code: b.code,
        customerName: b.profiles.full_name || 'Khách hàng',
        customerPhone: b.profiles.phone || '',
        customerEmail: b.profiles.email,
        fieldName: b.fields.name,
        startTime: b.start_time.toISOString(),
        endTime: b.end_time.toISOString(),
        status: b.status,
        finalPrice: b.final_price,
        createdAt: b.created_at.toISOString(),
      })),
    };
  }
}
