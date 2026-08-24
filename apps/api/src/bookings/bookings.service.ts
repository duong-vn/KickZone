import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  booking_status,
  discount_type,
  field_status,
} from '../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { AuthenticatedProfile } from '../auth/supabase-auth.service.js';
import { EmailService } from '../email/email.service.js';
import type { CancelBookingDto } from './dto/cancel-booking.dto.js';
import type { CreateBookingDto } from './dto/create-booking.dto.js';
import type { ListBookingsDto } from './dto/list-bookings.dto.js';
import {
  assertInsideOperatingHours,
  calculateDiscount,
  getSegments,
  parseBookingInterval,
  type BookingInterval,
} from './booking-rules.js';

export interface BookingResponse {
  id: string;
  code: string;
  field: {
    id: string;
    name: string;
    address: string;
    city: string;
    district: string;
    type: { id: string; name: string } | null;
    primaryImagePath: string | null;
  };
  voucher: { code: string } | null;
  startTime: string;
  endTime: string;
  status: booking_status;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  cancellationReason: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

const BOOKING_INCLUDE = {
  fields: {
    include: {
      field_types: true,
      field_images: { where: { is_primary: true }, take: 1 },
    },
  },
  vouchers: true,
} satisfies Prisma.bookingsInclude;

type BookingWithRelations = Prisma.bookingsGetPayload<{
  include: typeof BOOKING_INCLUDE;
}>;

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  async create(dto: CreateBookingDto, profile: AuthenticatedProfile) {
    const interval = parseBookingInterval(dto.startTime, dto.endTime);
    const booking = await this.prisma.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM fields WHERE id = ${dto.fieldId}::uuid FOR UPDATE
      `;
      if (locked.length === 0)
        throw this.notFound('FIELD_NOT_FOUND', 'Field was not found.');

      const field = await tx.fields.findFirst({
        where: {
          id: dto.fieldId,
          status: field_status.ACTIVE,
          deleted_at: null,
        },
        include: {
          field_operating_hours: { where: { day_of_week: interval.weekday } },
          price_rules: { where: { is_active: true } },
        },
      });
      if (!field)
        throw this.conflict('FIELD_UNAVAILABLE', 'Field is not available.');

      const hours = field.field_operating_hours[0];
      if (!hours) {
        throw this.conflict(
          'FIELD_CLOSED',
          'Field operating hours are unavailable.',
        );
      }
      assertInsideOperatingHours(interval, hours);

      const overlap = await tx.bookings.findFirst({
        where: {
          field_id: dto.fieldId,
          status: { in: [booking_status.PENDING, booking_status.CONFIRMED] },
          start_time: { lt: interval.end },
          end_time: { gt: interval.start },
        },
        select: { id: true },
      });
      if (overlap)
        throw this.conflict(
          'BOOKING_OVERLAP',
          'The selected time is already booked.',
        );

      const segments = getSegments(
        interval,
        field.price_rules,
        field.base_price_per_hour,
      );
      const originalPrice = segments.reduce(
        (sum, segment) => sum + segment.price,
        0,
      );
      let voucherId: string | undefined;
      let discountAmount = 0;
      const voucherCode = dto.voucherCode?.trim().toUpperCase();

      if (voucherCode) {
        const voucher = await tx.vouchers.findUnique({
          where: { code: voucherCode },
        });
        if (!voucher)
          throw this.conflict('VOUCHER_INVALID', 'Voucher is invalid.');
        await tx.$queryRaw`SELECT id FROM vouchers WHERE id = ${voucher.id}::uuid FOR UPDATE`;
        await this.assertVoucherUsable(tx, voucher, profile.id, originalPrice);
        voucherId = voucher.id;
        discountAmount = calculateDiscount(voucher, originalPrice);
      }

      const created = await tx.bookings.create({
        data: {
          user_id: profile.id,
          field_id: dto.fieldId,
          voucher_id: voucherId,
          start_time: interval.start,
          end_time: interval.end,
          original_price: originalPrice,
          discount_amount: discountAmount,
          final_price: originalPrice - discountAmount,
        },
      });
      if (voucherId) {
        await tx.voucher_usages.create({
          data: {
            voucher_id: voucherId,
            user_id: profile.id,
            booking_id: created.id,
          },
        });
      }
      return tx.bookings.findUniqueOrThrow({
        where: { id: created.id },
        include: BOOKING_INCLUDE,
      });
    });

    const response = this.mapBooking(booking);
    await this.email.sendBookingCreated(profile.email, response);
    return { data: response };
  }

  async validateVoucher(
    dto: {
      fieldId: string;
      startTime: string;
      endTime: string;
      code: string;
    },
    profile: AuthenticatedProfile,
  ) {
    const interval = parseBookingInterval(dto.startTime, dto.endTime);
    const field = await this.getBookableField(dto.fieldId, interval);
    const segments = getSegments(
      interval,
      field.price_rules,
      field.base_price_per_hour,
    );
    const originalPrice = segments.reduce(
      (sum, segment) => sum + segment.price,
      0,
    );
    const code = dto.code.trim().toUpperCase();
    const voucher = await this.prisma.vouchers.findUnique({ where: { code } });
    if (!voucher) throw this.conflict('VOUCHER_INVALID', 'Voucher is invalid.');
    await this.assertVoucherUsable(
      this.prisma,
      voucher,
      profile.id,
      originalPrice,
    );
    const discountAmount = calculateDiscount(voucher, originalPrice);
    return {
      data: {
        code,
        originalPrice,
        discountAmount,
        finalPrice: originalPrice - discountAmount,
      },
    };
  }

  async findMine(profile: AuthenticatedProfile, query: ListBookingsDto) {
    const where: Prisma.bookingsWhereInput = { user_id: profile.id };
    if (query.status) where.status = query.status;
    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { fields: { name: { contains: search, mode: 'insensitive' } } },
        { fields: { address: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [bookings, total] = await Promise.all([
      this.prisma.bookings.findMany({
        where,
        include: BOOKING_INCLUDE,
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.bookings.count({ where }),
    ]);
    return {
      data: bookings.map((booking) => this.mapBooking(booking)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string, profile: AuthenticatedProfile) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id },
      include: BOOKING_INCLUDE,
    });
    if (!booking)
      throw this.notFound('BOOKING_NOT_FOUND', 'Booking was not found.');
    if (booking.user_id !== profile.id && profile.role !== 'ADMIN') {
      throw new ForbiddenException({
        code: 'BOOKING_FORBIDDEN',
        message: 'Booking access is forbidden.',
      });
    }
    return { data: this.mapBooking(booking) };
  }

  async cancel(
    id: string,
    dto: CancelBookingDto,
    profile: AuthenticatedProfile,
  ) {
    const current = await this.prisma.bookings.findUnique({ where: { id } });
    if (!current)
      throw this.notFound('BOOKING_NOT_FOUND', 'Booking was not found.');
    if (current.user_id !== profile.id) {
      throw new ForbiddenException({
        code: 'BOOKING_FORBIDDEN',
        message: 'Booking access is forbidden.',
      });
    }
    if (current.status !== booking_status.PENDING) {
      throw this.conflict(
        'BOOKING_NOT_CANCELLABLE',
        'Only pending bookings can be cancelled.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.bookings.updateMany({
        where: { id, user_id: profile.id, status: booking_status.PENDING },
        data: {
          status: booking_status.CANCELLED,
          cancellation_reason: dto.reason?.trim() || null,
        },
      });
      if (result.count !== 1) {
        throw this.conflict(
          'BOOKING_STATE_CONFLICT',
          'Booking status changed while cancelling.',
        );
      }
      return tx.bookings.findUniqueOrThrow({
        where: { id },
        include: BOOKING_INCLUDE,
      });
    });

    const response = this.mapBooking(updated);
    await this.email.sendBookingCancelled(profile.email, response);
    return { data: response };
  }

  private async getBookableField(fieldId: string, interval: BookingInterval) {
    const field = await this.prisma.fields.findFirst({
      where: { id: fieldId, status: field_status.ACTIVE, deleted_at: null },
      include: {
        field_operating_hours: { where: { day_of_week: interval.weekday } },
        price_rules: { where: { is_active: true } },
      },
    });
    if (!field) throw this.notFound('FIELD_NOT_FOUND', 'Field was not found.');
    const hours = field.field_operating_hours[0];
    if (!hours)
      throw this.conflict(
        'FIELD_CLOSED',
        'Field operating hours are unavailable.',
      );
    assertInsideOperatingHours(interval, hours);
    return field;
  }

  private async assertVoucherUsable(
    client: PrismaService | Prisma.TransactionClient,
    voucher: {
      id: string;
      is_active: boolean;
      start_at: Date | null;
      end_at: Date | null;
      min_order_value: number | null;
      usage_limit: number | null;
      per_user_limit: number | null;
      discount_type: discount_type;
      value: number;
      max_discount: number | null;
    },
    userId: string,
    originalPrice: number,
  ) {
    const now = new Date();
    if (!voucher.is_active)
      throw this.conflict('VOUCHER_INACTIVE', 'Voucher is inactive.');
    if (voucher.start_at && now < voucher.start_at)
      throw this.conflict('VOUCHER_NOT_STARTED', 'Voucher is not active yet.');
    if (voucher.end_at && now >= voucher.end_at)
      throw this.conflict('VOUCHER_EXPIRED', 'Voucher has expired.');
    if (
      voucher.min_order_value !== null &&
      originalPrice < voucher.min_order_value
    ) {
      throw this.conflict(
        'VOUCHER_MIN_ORDER_NOT_MET',
        'Booking value is too low for this voucher.',
      );
    }

    const consumingStatuses = [
      booking_status.PENDING,
      booking_status.CONFIRMED,
      booking_status.COMPLETED,
    ];
    const usageWhere = {
      voucher_id: voucher.id,
      bookings: { status: { in: consumingStatuses } },
    } satisfies Prisma.voucher_usagesWhereInput;
    const totalUsage = await client.voucher_usages.count({ where: usageWhere });
    if (voucher.usage_limit !== null && totalUsage >= voucher.usage_limit) {
      throw this.conflict(
        'VOUCHER_LIMIT_REACHED',
        'Voucher usage limit has been reached.',
      );
    }
    const userUsage = await client.voucher_usages.count({
      where: { ...usageWhere, user_id: userId },
    });
    if (
      voucher.per_user_limit !== null &&
      userUsage >= voucher.per_user_limit
    ) {
      throw this.conflict(
        'VOUCHER_USER_LIMIT_REACHED',
        'Your voucher usage limit has been reached.',
      );
    }
  }

  mapBooking(booking: BookingWithRelations): BookingResponse {
    return {
      id: booking.id,
      code: booking.code,
      field: {
        id: booking.fields.id,
        name: booking.fields.name,
        address: booking.fields.address,
        city: booking.fields.city,
        district: booking.fields.district,
        type: booking.fields.field_types
          ? {
              id: booking.fields.field_types.id,
              name: booking.fields.field_types.name,
            }
          : null,
        primaryImagePath: booking.fields.field_images[0]?.storage_path ?? null,
      },
      voucher: booking.vouchers ? { code: booking.vouchers.code } : null,
      startTime: booking.start_time.toISOString(),
      endTime: booking.end_time.toISOString(),
      status: booking.status,
      originalPrice: booking.original_price,
      discountAmount: booking.discount_amount,
      finalPrice: booking.final_price,
      cancellationReason: booking.cancellation_reason,
      rejectionReason: booking.rejection_reason,
      createdAt: booking.created_at.toISOString(),
      updatedAt: booking.updated_at.toISOString(),
    };
  }

  private notFound(code: string, message: string): NotFoundException {
    return new NotFoundException({ code, message });
  }

  private conflict(code: string, message: string): ConflictException {
    return new ConflictException({ code, message });
  }
}
