import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  QueryAdminBookingsDto,
  RejectBookingDto,
} from './dto/query-bookings.dto';
import { booking_status, Prisma } from '../../generated/prisma/client';

@Injectable()
export class AdminBookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryAdminBookingsDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.bookingsWhereInput = {};

    if (query.status && query.status !== 'all') {
      const normalizedStatus = query.status.toUpperCase() as booking_status;
      if (Object.values(booking_status).includes(normalizedStatus)) {
        where.status = normalizedStatus;
      }
    }

    if (query.fieldId) {
      where.field_id = query.fieldId;
    }

    if (query.userId) {
      where.user_id = query.userId;
    }

    if (query.from || query.to) {
      where.start_time = {};
      if (query.from) {
        where.start_time.gte = new Date(query.from);
      }
      if (query.to) {
        where.start_time.lte = new Date(query.to);
      }
    }

    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        {
          profiles: {
            OR: [
              { full_name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
        {
          fields: {
            name: { contains: q, mode: 'insensitive' },
          },
        },
      ];
    }

    const [total, bookings] = await Promise.all([
      this.prisma.bookings.count({ where }),
      this.prisma.bookings.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          profiles: {
            select: {
              id: true,
              full_name: true,
              email: true,
              phone: true,
              avatar_path: true,
            },
          },
          fields: {
            select: {
              id: true,
              name: true,
              address: true,
              district: true,
              city: true,
              field_types: { select: { name: true } },
            },
          },
          vouchers: {
            select: {
              code: true,
              discount_type: true,
              value: true,
            },
          },
        },
      }),
    ]);

    return {
      data: bookings.map((b) => ({
        id: b.id,
        code: b.code,
        userId: b.user_id,
        customerName: b.profiles?.full_name || 'Khách hàng',
        customerPhone: b.profiles?.phone || '',
        customerEmail: b.profiles?.email || '',
        customerAvatar: b.profiles?.avatar_path || undefined,
        fieldId: b.field_id,
        fieldName: b.fields?.name || '',
        fieldTypeLabel: b.fields?.field_types?.name || 'Sân bóng',
        fieldAddress: b.fields?.address || '',
        startTime: b.start_time.toISOString(),
        endTime: b.end_time.toISOString(),
        bookingDate: b.start_time.toISOString().split('T')[0],
        status: b.status,
        originalPrice: b.original_price,
        discountAmount: b.discount_amount,
        finalPrice: b.final_price,
        voucherCode: b.vouchers?.code,
        rejectionReason: b.rejection_reason,
        cancellationReason: b.cancellation_reason,
        createdAt: b.created_at.toISOString(),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );

    const booking = await this.prisma.bookings.findFirst({
      where: isUuid
        ? { id }
        : { code: { equals: id, mode: 'insensitive' } },
      include: {
        profiles: true,
        fields: {
          include: {
            field_types: true,
            field_images: true,
            field_operating_hours: {
              orderBy: { day_of_week: 'asc' },
            },
          },
        },
        vouchers: true,
        reviews: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Không tìm thấy đơn đặt sân #${id}`);
    }

    const fieldImages = await this.prisma.field_images.findMany({
      where: { field_id: booking.field_id },
      orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }],
    });

    return {
      id: booking.id,
      code: booking.code,
      userId: booking.user_id,
      user: {
        id: booking.profiles.id,
        fullName: booking.profiles.full_name || 'Khách hàng',
        email: booking.profiles.email,
        phone: booking.profiles.phone || '',
        avatarUrl: booking.profiles.avatar_path || undefined,
        role: booking.profiles.role,
        status: booking.profiles.status,
      },
      fieldId: booking.field_id,
      field: {
        id: booking.fields.id,
        name: booking.fields.name,
        address: booking.fields.address,
        district: booking.fields.district,
        city: booking.fields.city,
        fieldType: booking.fields.field_types.name,
        basePricePerHour: booking.fields.base_price_per_hour,
        images: fieldImages.map((img) => img.storage_path),
      },
      startTime: booking.start_time.toISOString(),
      endTime: booking.end_time.toISOString(),
      bookingDate: booking.start_time.toISOString().split('T')[0],
      status: booking.status,
      originalPrice: booking.original_price,
      discountAmount: booking.discount_amount,
      finalPrice: booking.final_price,
      voucher: booking.vouchers
        ? {
            id: booking.vouchers.id,
            code: booking.vouchers.code,
            discountType: booking.vouchers.discount_type,
            discountValue: booking.vouchers.value,
          }
        : null,
      rejectionReason: booking.rejection_reason,
      cancellationReason: booking.cancellation_reason,
      review: booking.reviews
        ? {
            id: booking.reviews.id,
            rating: booking.reviews.rating,
            content: booking.reviews.content,
            createdAt: booking.reviews.created_at.toISOString(),
          }
        : null,
      createdAt: booking.created_at.toISOString(),
      updatedAt: booking.updated_at.toISOString(),
    };
  }

  async approve(id: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );

    const updated = await this.prisma.bookings.updateMany({
      where: {
        ...(isUuid ? { id } : { code: { equals: id, mode: 'insensitive' } }),
        status: booking_status.PENDING,
      },
      data: {
        status: booking_status.CONFIRMED,
        updated_at: new Date(),
      },
    });

    if (updated.count === 0) {
      throw new BadRequestException(
        'Đơn đặt sân không ở trạng thái Chờ xác nhận hoặc không tồn tại.',
      );
    }

    return this.findOne(id);
  }

  async reject(id: string, dto: RejectBookingDto) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );

    const updated = await this.prisma.bookings.updateMany({
      where: {
        ...(isUuid ? { id } : { code: { equals: id, mode: 'insensitive' } }),
        status: booking_status.PENDING,
      },
      data: {
        status: booking_status.REJECTED,
        rejection_reason: dto.reason?.trim() || 'Admin từ chối đơn đặt sân',
        updated_at: new Date(),
      },
    });

    if (updated.count === 0) {
      throw new BadRequestException(
        'Đơn đặt sân không ở trạng thái Chờ xác nhận hoặc không tồn tại.',
      );
    }

    return this.findOne(id);
  }

  async getCalendar(from?: string, to?: string, fieldId?: string) {
    const where: Prisma.bookingsWhereInput = {
      status: {
        in: [
          booking_status.PENDING,
          booking_status.CONFIRMED,
          booking_status.COMPLETED,
          booking_status.REJECTED,
          booking_status.CANCELLED,
        ],
      },
    };

    if (fieldId && fieldId !== 'all') {
      where.field_id = fieldId;
    }

    if (from || to) {
      where.start_time = {};
      if (from) where.start_time.gte = new Date(from);
      if (to) where.start_time.lte = new Date(to);
    }

    const bookings = await this.prisma.bookings.findMany({
      where,
      orderBy: { start_time: 'asc' },
      include: {
        fields: {
          select: {
            id: true,
            name: true,
            field_types: { select: { name: true } },
          },
        },
        profiles: {
          select: {
            id: true,
            full_name: true,
            phone: true,
            email: true,
            avatar_path: true,
          },
        },
      },
    });

    return bookings.map((b) => ({
      id: b.id,
      code: b.code,
      fieldId: b.field_id,
      fieldName: b.fields?.name || '',
      fieldTypeLabel: b.fields?.field_types?.name || 'Sân bóng',
      customerName: b.profiles?.full_name || 'Khách hàng',
      customerPhone: b.profiles?.phone || '',
      customerEmail: b.profiles?.email || '',
      customerAvatar: b.profiles?.avatar_path || undefined,
      startTime: b.start_time.toISOString(),
      endTime: b.end_time.toISOString(),
      status: b.status,
      finalPrice: b.final_price,
    }));
  }
}
