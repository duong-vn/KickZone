import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { booking_status } from '../../generated/prisma/client';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalBookings,
      pendingCount,
      confirmedCount,
      completedCount,
      activeFieldsCount,
      totalUsersCount,
      revenueResult,
      recentBookings,
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
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          profiles: { select: { full_name: true, phone: true, email: true } },
          fields: { select: { name: true } },
        },
      }),
    ]);

    return {
      totalRevenue: revenueResult._sum.final_price || 0,
      totalBookings,
      pendingBookingsCount: pendingCount,
      confirmedBookingsCount: confirmedCount,
      completedBookingsCount: completedCount,
      activeFieldsCount,
      totalUsersCount,
      recentBookings: recentBookings.map((b) => ({
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
