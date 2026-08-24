
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
import { GetFieldsQueryDto } from './dto/get-fields-query.dto.js';

const PUBLIC_FIELD_WHERE = {
  status: field_status.ACTIVE,
  deleted_at: null,
} satisfies Prisma.fieldsWhereInput;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 9;
const MAX_LIMIT = 100;


@Injectable()
export class FieldsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(query: GetFieldsQueryDto) {
    const page =
      query.page &&
        Number.isInteger(Number(query.page)) &&
        Number(query.page) >= 1
        ? Number(query.page)
        : DEFAULT_PAGE;
    const rawLimit =
      query.limit &&
        Number.isInteger(Number(query.limit)) &&
        Number(query.limit) >= 1
        ? Number(query.limit)
        : DEFAULT_LIMIT;
    const limit = Math.min(rawLimit, MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where: Prisma.fieldsWhereInput = {
      status: 'ACTIVE',
      deleted_at: null,
    };

    if (query.search && query.search.trim()) {
      const searchKeyword = query.search.trim();
      where.OR = [
        { name: { contains: searchKeyword, mode: 'insensitive' } },
        { address: { contains: searchKeyword, mode: 'insensitive' } },
        { description: { contains: searchKeyword, mode: 'insensitive' } },
      ];
    }

    if (
      query.district &&
      query.district.trim() &&
      query.district !== 'Tất cả quận/huyện'
    ) {
      where.district = {
        equals: query.district.trim(),
        mode: 'insensitive',
      };
    }

    const typeFilter = query.type || query.fieldType;
    if (typeFilter && typeFilter.trim()) {
      const rawTypes = typeFilter
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const expandedTypes = new Set<string>();
      for (const t of rawTypes) {
        expandedTypes.add(t);
        if (t === 'Sân 5' || t === '5-a-side' || t === '5') {
          expandedTypes.add('Sân 5');
          expandedTypes.add('5-a-side');
          expandedTypes.add('5');
        } else if (t === 'Sân 7' || t === '7-a-side' || t === '7') {
          expandedTypes.add('Sân 7');
          expandedTypes.add('7-a-side');
          expandedTypes.add('7');
        } else if (t === 'Sân 11' || t === '11-a-side' || t === '11') {
          expandedTypes.add('Sân 11');
          expandedTypes.add('11-a-side');
          expandedTypes.add('11');
        }
      }

      where.field_types = {
        name: { in: Array.from(expandedTypes), mode: 'insensitive' },
      };
    }

    const minPrice =
      query.minPrice !== undefined &&
        Number.isFinite(Number(query.minPrice)) &&
        Number(query.minPrice) >= 0
        ? Number(query.minPrice)
        : undefined;
    const maxPrice =
      query.maxPrice !== undefined &&
        Number.isFinite(Number(query.maxPrice)) &&
        Number(query.maxPrice) >= 0
        ? Number(query.maxPrice)
        : undefined;

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.base_price_per_hour = {
        ...(query.minPrice !== undefined && { gte: query.minPrice }),
        ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
      };
    }

    // Availability filter by Date and Time Slot
    let startTimeStr = query.startTime;
    let endTimeStr = query.endTime;

    if (
      !startTimeStr &&
      !endTimeStr &&
      query.timeSlot &&
      query.timeSlot !== 'Tất cả'
    ) {
      const parts = query.timeSlot.split('-').map((s) => s.trim());
      if (parts.length === 2) {
        startTimeStr = parts[0];
        endTimeStr = parts[1];
      }
    }

    if (query.date && startTimeStr && endTimeStr) {
      try {
        const startISO = new Date(`${query.date}T${startTimeStr}:00+07:00`);
        const endISO = new Date(`${query.date}T${endTimeStr}:00+07:00`);

        if (
          !isNaN(startISO.getTime()) &&
          !isNaN(endISO.getTime()) &&
          startISO < endISO
        ) {
          where.bookings = {
            none: {
              status: { in: ['PENDING', 'CONFIRMED'] },
              start_time: { lt: endISO },
              end_time: { gt: startISO },
            },
          };
        }
      } catch {
        // ignore invalid date parse
      }
    }

    let orderBy: Prisma.fieldsOrderByWithRelationInput = { created_at: 'desc' };
    if (query.sortBy === 'price-asc') {
      orderBy = { base_price_per_hour: 'asc' };
    } else if (query.sortBy === 'price-desc') {
      orderBy = { base_price_per_hour: 'desc' };
    } else if (query.sortBy === 'featured' || query.sortBy === 'newest') {
      orderBy = { created_at: 'desc' };
    }

    const [fields, total] = await Promise.all([
      this.prisma.fields.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          field_types: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          field_images: {
            orderBy: { sort_order: 'asc' },
            select: {
              id: true,
              storage_path: true,
              alt_text: true,
              is_primary: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      }),
      this.prisma.fields.count({ where }),
    ]);

    const transformedData = fields.map((field) => {
      const reviews = field.reviews ?? [];
      const reviewsCount = reviews.length;
      const ratingAvg =
        reviewsCount > 0
          ? Number(
            (
              reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount
            ).toFixed(1),
          )
          : 5.0;

      const fieldTypeName = field.field_types?.name ?? 'Sân bóng đá';
      const primaryImage =
        field.field_images?.find((img) => img.is_primary) ??
        field.field_images?.[0];
      const imageUrl =
        primaryImage?.storage_path ||
        'https://images.unsplash.com/photo-1529900240051-5120302b7405?auto=format&fit=crop&w=800&q=80';

      return {
        id: field.id,
        name: field.name,
        slug: field.slug,
        description: field.description,
        address: field.address,
        location: field.address,
        city: field.city,
        district: field.district,
        latitude: field.latitude ? Number(field.latitude) : null,
        longitude: field.longitude ? Number(field.longitude) : null,
        base_price_per_hour: field.base_price_per_hour,
        pricePerHour: field.base_price_per_hour,
        status: field.status,
        created_at: field.created_at,
        updated_at: field.updated_at,
        field_type_id: field.field_type_id,
        field_types: field.field_types,
        field_type: field.field_types,
        type: fieldTypeName,
        types: [fieldTypeName],
        image: imageUrl,
        primary_image_url: imageUrl,
        field_images: field.field_images ?? [],
        rating: ratingAvg,
        rating_avg: ratingAvg,
        reviews_count: reviewsCount,
        available: true,
      };
    });

    if (query.sortBy === 'rating') {
      transformedData.sort((a, b) => b.rating - a.rating);
    }

    return {
      data: transformedData,
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
