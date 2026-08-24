import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  field_status,
  booking_status,
} from '../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  getSegments,
  getSqlTimeMinutes,
  makeLocalDateTime,
  parseAvailabilityDate,
  type BookingInterval,
  type PriceRuleInput,
} from '../bookings/booking-rules.js';
import type { GetFieldsQueryDto } from './fields.controller.js';

const PUBLIC_FIELD_WHERE = {
  status: field_status.ACTIVE,
  deleted_at: null,
} satisfies Prisma.fieldsWhereInput;

@Injectable()
export class FieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetFieldsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 9;
    const where: Prisma.fieldsWhereInput = { ...PUBLIC_FIELD_WHERE };

    if (query.search?.trim()) {
      where.OR = [
        { name: { contains: query.search.trim(), mode: 'insensitive' } },
        { address: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    if (query.district && query.district !== 'Tất cả quận/huyện') {
      where.district = { equals: query.district, mode: 'insensitive' };
    }

    if (query.type?.trim()) {
      where.field_types = {
        name: { contains: query.type.trim(), mode: 'insensitive' },
      };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.base_price_per_hour = {
        ...(query.minPrice !== undefined && { gte: query.minPrice }),
        ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.fields.findMany({
        where,
        include: {
          field_types: true,
          field_images: { orderBy: { sort_order: 'asc' } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.fields.count({ where }),
    ]);

    return {
      data: data.map((field) => this.mapField(field)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const field = await this.prisma.fields.findFirst({
      where: { ...PUBLIC_FIELD_WHERE, id },
      include: {
        field_types: true,
        field_images: { orderBy: { sort_order: 'asc' } },
        field_operating_hours: { orderBy: { day_of_week: 'asc' } },
      },
    });
    if (!field) {
      throw new NotFoundException({
        code: 'FIELD_NOT_FOUND',
        message: 'Field was not found.',
      });
    }
    return { data: this.mapField(field) };
  }

  async getAvailability(id: string, dateValue: string) {
    const { date, weekday } = parseAvailabilityDate(dateValue);
    const field = await this.prisma.fields.findFirst({
      where: { ...PUBLIC_FIELD_WHERE, id },
      include: {
        field_operating_hours: { where: { day_of_week: weekday } },
        price_rules: { where: { is_active: true } },
      },
    });
    if (!field) {
      throw new NotFoundException({
        code: 'FIELD_NOT_FOUND',
        message: 'Field was not found.',
      });
    }

    const hours = field.field_operating_hours[0];
    if (!hours || hours.is_closed || !hours.open_time || !hours.close_time) {
      return {
        data: { fieldId: id, date, timeZone: 'Asia/Ho_Chi_Minh', slots: [] },
      };
    }

    const start = makeLocalDateTime(date, getSqlTimeMinutes(hours.open_time));
    const end = makeLocalDateTime(date, getSqlTimeMinutes(hours.close_time));
    const interval = {
      start,
      end,
      localDate: date,
      weekday,
    } satisfies BookingInterval;
    const bookings = await this.prisma.bookings.findMany({
      where: {
        field_id: id,
        status: { in: [booking_status.PENDING, booking_status.CONFIRMED] },
        start_time: { lt: end },
        end_time: { gt: start },
      },
      select: { start_time: true, end_time: true },
    });
    const rules = field.price_rules as PriceRuleInput[];
    const segments = getSegments(interval, rules, field.base_price_per_hour);
    const now = new Date();

    return {
      data: {
        fieldId: id,
        date,
        timeZone: 'Asia/Ho_Chi_Minh',
        slots: segments.map((segment) => ({
          startTime: segment.start.toISOString(),
          endTime: segment.end.toISOString(),
          available:
            segment.start > now &&
            !bookings.some(
              (booking) =>
                segment.start < booking.end_time &&
                segment.end > booking.start_time,
            ),
          price: segment.price,
        })),
      },
    };
  }

  mapField(field: {
    id: string;
    field_type_id: string;
    name: string;
    slug: string;
    description: string | null;
    address: string;
    city: string;
    district: string;
    latitude: unknown;
    longitude: unknown;
    base_price_per_hour: number;
    status: field_status;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
    field_types?: { id: string; name: string; description: string | null };
    field_images?: Array<{
      id: string;
      storage_path: string;
      alt_text: string | null;
      sort_order: number;
      is_primary: boolean;
    }>;
    field_operating_hours?: Array<{
      day_of_week: number;
      open_time: Date | null;
      close_time: Date | null;
      is_closed: boolean;
    }>;
  }) {
    return {
      id: field.id,
      name: field.name,
      slug: field.slug,
      description: field.description,
      address: field.address,
      city: field.city,
      district: field.district,
      latitude: field.latitude,
      longitude: field.longitude,
      basePricePerHour: field.base_price_per_hour,
      type: field.field_types
        ? {
            id: field.field_types.id,
            name: field.field_types.name,
            description: field.field_types.description,
          }
        : null,
      images: (field.field_images ?? []).map((image) => ({
        id: image.id,
        storagePath: image.storage_path,
        altText: image.alt_text,
        sortOrder: image.sort_order,
        isPrimary: image.is_primary,
      })),
      operatingHours: (field.field_operating_hours ?? []).map((hours) => ({
        dayOfWeek: hours.day_of_week,
        openTime: hours.open_time?.toISOString().slice(11, 16) ?? null,
        closeTime: hours.close_time?.toISOString().slice(11, 16) ?? null,
        isClosed: hours.is_closed,
      })),
      createdAt: field.created_at.toISOString(),
      updatedAt: field.updated_at.toISOString(),
    };
  }
}
