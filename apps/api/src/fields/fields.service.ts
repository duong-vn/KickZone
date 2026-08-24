import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Prisma,
  field_status,
  booking_status,
} from '../generated/prisma/client';
import {
  getSegments,
  getSqlTimeMinutes,
  makeLocalDateTime,
  parseAvailabilityDate,
  type BookingInterval,
  type PriceRuleInput,
} from '../bookings/booking-rules';
import { GetFieldReviewsQueryDto } from './dto/get-field-reviews-query.dto';
import { GetFieldsQueryDto } from './dto/get-fields-query.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 9;
const MAX_LIMIT = 100;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PUBLIC_FIELD_WHERE = {
  status: field_status.ACTIVE,
  deleted_at: null,
} satisfies Prisma.fieldsWhereInput;

@Injectable()
export class FieldsService {
  constructor(private readonly prisma: PrismaService) {}

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

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.base_price_per_hour = {
        ...(query.minPrice !== undefined && { gte: Number(query.minPrice) }),
        ...(query.maxPrice !== undefined && { lte: Number(query.maxPrice) }),
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

    const formatFieldTypeName = (name?: string | null): string => {
      if (!name) return 'Sân 7 người';
      const clean = name.toLowerCase().trim();
      if (clean === '5-a-side' || clean === '5' || clean.includes('5'))
        return 'Sân 5 người';
      if (clean === '7-a-side' || clean === '7' || clean.includes('7'))
        return 'Sân 7 người';
      if (clean === '11-a-side' || clean === '11' || clean.includes('11'))
        return 'Sân 11 người';
      return name;
    };

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

      const rawTypeName = field.field_types?.name ?? '7-a-side';
      const fieldTypeName = formatFieldTypeName(rawTypeName);
      const primaryImg =
        field.field_images?.find((img) => img.is_primary) ??
        field.field_images?.[0];
      const imageUrl =
        primaryImg?.storage_path ||
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80';

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
    if (!id || !UUID_REGEX.test(id)) {
      throw new NotFoundException(`Field with ID "${id}" not found`);
    }

    const [field, images] = await Promise.all([
      this.prisma.fields.findFirst({
        where: {
          id,
          status: 'ACTIVE',
          deleted_at: null,
        },
        include: {
          field_types: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          field_operating_hours: {
            orderBy: {
              day_of_week: 'asc',
            },
            select: {
              id: true,
              field_id: true,
              day_of_week: true,
              open_time: true,
              close_time: true,
              is_closed: true,
            },
          },
          price_rules: {
            where: {
              is_active: true,
            },
            orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
            select: {
              id: true,
              field_id: true,
              name: true,
              day_of_week: true,
              start_time: true,
              end_time: true,
              price_per_hour: true,
              effective_from: true,
              effective_to: true,
              priority: true,
              is_active: true,
            },
          },
          reviews: {
            orderBy: {
              created_at: 'desc',
            },
            select: {
              id: true,
              user_id: true,
              rating: true,
              content: true,
              created_at: true,
              updated_at: true,
              profiles: {
                select: {
                  id: true,
                  full_name: true,
                  avatar_path: true,
                  role: true,
                },
              },
              bookings: {
                select: {
                  id: true,
                  code: true,
                  start_time: true,
                  end_time: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.field_images.findMany({
        where: { field_id: id },
        orderBy: [
          { is_primary: 'desc' },
          { sort_order: 'asc' },
          { created_at: 'asc' },
        ],
        select: {
          id: true,
          field_id: true,
          storage_path: true,
          alt_text: true,
          sort_order: true,
          is_primary: true,
          created_at: true,
        },
      }),
    ]);

    if (!field) {
      throw new NotFoundException(`Field with ID "${id}" not found`);
    }

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

    const formatFieldTypeName = (name?: string | null): string => {
      if (!name) return 'Sân 7 người';
      const clean = name.toLowerCase().trim();
      if (clean === '5-a-side' || clean === '5' || clean.includes('5'))
        return 'Sân 5 người';
      if (clean === '7-a-side' || clean === '7' || clean.includes('7'))
        return 'Sân 7 người';
      if (clean === '11-a-side' || clean === '11' || clean.includes('11'))
        return 'Sân 11 người';
      return name;
    };

    const rawTypeName = field.field_types?.name ?? '7-a-side';
    const fieldTypeName = formatFieldTypeName(rawTypeName);

    const defaultImages = [
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=800&q=80',
    ];

    const imageList =
      images.length > 0 ? images.map((img) => img.storage_path) : defaultImages;

    const primaryImage =
      images.find((img) => img.is_primary)?.storage_path ||
      images[0]?.storage_path ||
      defaultImages[0];

    // Format operating hours display string
    let operatingHoursDisplay = '06:00 - 23:00 hàng ngày';
    if (field.field_operating_hours && field.field_operating_hours.length > 0) {
      const firstOpen = field.field_operating_hours.find(
        (h) => !h.is_closed && h.open_time && h.close_time,
      );
      if (firstOpen && firstOpen.open_time && firstOpen.close_time) {
        const formatTime = (d: Date) => {
          const dateObj = new Date(d);
          return dateObj.toISOString().substring(11, 16);
        };
        operatingHoursDisplay = `${formatTime(firstOpen.open_time)} - ${formatTime(firstOpen.close_time)} hàng ngày`;
      }
    }

    const amenities = [
      {
        icon: 'Car',
        label: 'Bãi giữ xe rộng rãi',
        desc: 'Có chỗ đỗ ô tô và xe máy an toàn',
      },
      {
        icon: 'Droplets',
        label: 'Nước uống phục vụ',
        desc: 'Trà đá và nước mát giải khát',
      },
      {
        icon: 'Shirt',
        label: 'Phòng thay đồ & Tủ khóa',
        desc: 'Khu vực thay đồ sạch sẽ, có tủ gửi đồ',
      },
      {
        icon: 'Wifi',
        label: 'Wifi miễn phí',
        desc: 'Phủ sóng toàn bộ khuôn viên sân',
      },
      {
        icon: 'Lightbulb',
        label: 'Dàn đèn LED cao áp',
        desc: 'Độ sáng đạt chuẩn thi đấu ban đêm',
      },
      {
        icon: 'Coffee',
        label: 'Căn tin giải khát',
        desc: 'Phục vụ nước uống và đồ ăn nhẹ',
      },
    ];

    const rules = [
      'Vui lòng sử dụng giày đế TF (đinh dăm) hoặc IC (futsal), nghiêm cấm giày đinh sắt SG.',
      'Đến trước giờ thi đấu 10-15 phút để chuẩn bị và làm thủ tục nhận sân.',
      'Nghiêm cấm hút thuốc, xả rác bừa bãi và mang chất dễ cháy nổ vào sân.',
      'Hủy hoặc thay đổi lịch đặt phải thực hiện trước giờ bắt đầu ít nhất 12 tiếng.',
    ];

    const subPitches = [
      {
        id: `${field.id}-1`,
        name: `${fieldTypeName} - Sân A1 (Cỏ mới)`,
        type: fieldTypeName,
        pricePerHour: field.base_price_per_hour,
      },
      {
        id: `${field.id}-2`,
        name: `${fieldTypeName} - Sân A2 (Tiêu chuẩn)`,
        type: fieldTypeName,
        pricePerHour: field.base_price_per_hour,
      },
    ];

    const mappedReviews = reviews.map((r) => ({
      id: r.id,
      author: r.profiles?.full_name || 'Khách hàng',
      avatar:
        r.profiles?.avatar_path ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      date: r.created_at
        ? new Date(r.created_at).toISOString()
        : new Date().toISOString(),
      rating: r.rating,
      content: r.content,
      verified: true,
      user: {
        id: r.profiles?.id || r.user_id,
        fullName: r.profiles?.full_name || 'Khách hàng',
        avatarUrl: r.profiles?.avatar_path || null,
        role: r.profiles?.role || 'USER',
      },
      booking: r.bookings
        ? {
            id: r.bookings.id,
            code: r.bookings.code,
            fieldName: field.name,
            matchDate: r.bookings.start_time
              ? new Date(r.bookings.start_time).toISOString().split('T')[0]
              : '',
            timeSlot:
              r.bookings.start_time && r.bookings.end_time
                ? `${new Date(r.bookings.start_time).toISOString().substring(11, 16)} - ${new Date(r.bookings.end_time).toISOString().substring(11, 16)}`
                : '',
            fieldTypeName,
          }
        : undefined,
    }));

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
      image: primaryImage,
      primary_image_url: primaryImage,
      images: imageList,
      field_images: images,
      field_operating_hours: field.field_operating_hours,
      price_rules: field.price_rules,
      rating: ratingAvg,
      rating_avg: ratingAvg,
      reviews_count: reviewsCount,
      reviewCount: reviewsCount,
      available: true,
      operatingHours: operatingHoursDisplay,
      amenities,
      rules,
      subPitches,
      reviews: mappedReviews,
    };
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

  async findReviews(id: string, query: GetFieldReviewsQueryDto) {
    if (!id || !UUID_REGEX.test(id)) {
      throw new NotFoundException(`Field with ID "${id}" not found`);
    }

    const field = await this.prisma.fields.findFirst({
      where: {
        id,
        status: 'ACTIVE',
        deleted_at: null,
      },
      select: { id: true, name: true, field_types: { select: { name: true } } },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID "${id}" not found`);
    }

    const page = query.page && Number(query.page) >= 1 ? Number(query.page) : 1;
    const limit =
      query.limit && Number(query.limit) >= 1
        ? Math.min(Number(query.limit), 50)
        : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.reviewsWhereInput = {
      field_id: id,
      ...(query.rating ? { rating: Number(query.rating) } : {}),
    };

    let orderBy: Prisma.reviewsOrderByWithRelationInput = {
      created_at: 'desc',
    };
    if (query.sortBy === 'oldest') {
      orderBy = { created_at: 'asc' };
    } else if (query.sortBy === 'highest') {
      orderBy = { rating: 'desc' };
    } else if (query.sortBy === 'lowest') {
      orderBy = { rating: 'asc' };
    }

    const [reviews, total, allFieldReviews] = await Promise.all([
      this.prisma.reviews.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          profiles: {
            select: {
              id: true,
              full_name: true,
              avatar_path: true,
              role: true,
            },
          },
          bookings: {
            select: {
              id: true,
              code: true,
              start_time: true,
              end_time: true,
            },
          },
        },
      }),
      this.prisma.reviews.count({ where }),
      this.prisma.reviews.findMany({
        where: { field_id: id },
        select: { rating: true },
      }),
    ]);

    const totalAllReviews = allFieldReviews.length;
    const averageRating =
      totalAllReviews > 0
        ? Number(
            (
              allFieldReviews.reduce((sum, r) => sum + r.rating, 0) /
              totalAllReviews
            ).toFixed(1),
          )
        : 5.0;

    const breakdown = [5, 4, 3, 2, 1].map((star) => {
      const count = allFieldReviews.filter((r) => r.rating === star).length;
      const percentage =
        totalAllReviews > 0 ? Math.round((count / totalAllReviews) * 100) : 0;
      return { star, count, percentage };
    });

    const transformedData = reviews.map((r) => ({
      id: r.id,
      userId: r.user_id,
      fieldId: r.field_id,
      bookingId: r.booking_id,
      rating: r.rating,
      content: r.content,
      createdAt: r.created_at
        ? new Date(r.created_at).toISOString()
        : new Date().toISOString(),
      updatedAt: r.updated_at
        ? new Date(r.updated_at).toISOString()
        : undefined,
      user: {
        id: r.profiles?.id || r.user_id,
        fullName: r.profiles?.full_name || 'Khách hàng',
        avatarUrl: r.profiles?.avatar_path || null,
        role: r.profiles?.role || 'USER',
      },
      booking: r.bookings
        ? {
            id: r.bookings.id,
            code: r.bookings.code,
            fieldName: field.name,
            matchDate: r.bookings.start_time
              ? new Date(r.bookings.start_time).toISOString().split('T')[0]
              : '',
            timeSlot:
              r.bookings.start_time && r.bookings.end_time
                ? `${new Date(r.bookings.start_time).toISOString().substring(11, 16)} - ${new Date(r.bookings.end_time).toISOString().substring(11, 16)}`
                : '',
            fieldTypeName: field.field_types?.name || 'Sân bóng đá',
          }
        : undefined,
      comments: [],
      verifiedBooking: true,
    }));

    return {
      data: transformedData,
      meta: {
        total,
        page,
        limit,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
      summary: {
        averageRating,
        totalReviews: totalAllReviews,
        breakdown,
      },
    };
  }
}
