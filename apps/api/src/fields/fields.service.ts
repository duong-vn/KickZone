import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { GetFieldsQueryDto } from './dto/get-fields-query.dto';

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
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
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
        skip,
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
      const imageUrl =
        field.field_images?.storage_path ||
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
        field_images: field.field_images ? [field.field_images] : [],
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
      meta: {
        total,
        page,
        limit,
        totalPages: total > 0 ? Math.ceil(total / limit) : 0,
      },
    };
  }

  async findOne(idOrSlug: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    const where: Prisma.fieldsWhereInput = isUuid
      ? { id: idOrSlug, deleted_at: null }
      : { slug: idOrSlug, deleted_at: null };

    const field = await this.prisma.fields.findFirst({
      where,
      include: {
        field_types: true,
        field_images: true,
        field_operating_hours: {
          orderBy: { day_of_week: 'asc' },
        },
        price_rules: {
          where: { is_active: true },
          orderBy: { priority: 'desc' },
        },
        reviews: {
          include: {
            profiles: true,
          },
          orderBy: { created_at: 'desc' },
          take: 20,
        },
      },
    });

    if (!field) {
      throw new NotFoundException('Sân bóng không tồn tại hoặc đã bị xóa');
    }

    const fieldImages = await this.prisma.field_images.findMany({
      where: { field_id: field.id },
      orderBy: { sort_order: 'asc' },
    });

    const imageUrls =
      fieldImages.length > 0
        ? fieldImages.map((img) => img.storage_path)
        : [
          'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
        ];

    return {
      id: field.id,
      name: field.name,
      slug: field.slug,
      description:
        field.description ||
        'Sân cỏ nhân tạo chất lượng cao, dàn đèn LED hiện đại và dịch vụ đầy đủ.',
      address: field.address,
      city: field.city,
      district: field.district,
      location: `${field.address}, ${field.district}, ${field.city}`,
      basePricePerHour: field.base_price_per_hour,
      status: field.status,
      fieldType: field.field_types?.name || 'Sân 7 người',
      fieldTypeId: field.field_type_id,
      types: [field.field_types?.name || 'Sân 7 người'],
      rating: 4.8,
      reviewCount: field.reviews.length,
      images: imageUrls,
      subPitches: [
        {
          id: `sp-${field.id}-1`,
          name: `${field.name} - Sân A`,
          type: field.field_types?.name || 'Sân 7 người',
          pricePerHour: field.base_price_per_hour,
        },
      ],
      priceRules: field.price_rules.map((pr) => ({
        id: pr.id,
        name: pr.name,
        dayOfWeek: pr.day_of_week,
        startTime: pr.start_time.toISOString().substring(11, 16),
        endTime: pr.end_time.toISOString().substring(11, 16),
        pricePerHour: pr.price_per_hour,
        isActive: pr.is_active,
      })),
      operatingHours: '06:00 - 22:00 hàng ngày',
      amenities: [
        { icon: 'Wifi', label: 'Wifi miễn phí', desc: 'Tốc độ cao' },
        { icon: 'Car', label: 'Bãi đỗ xe', desc: 'Ô tô và xe máy rộng rãi' },
        { icon: 'Droplets', label: 'Nước uống', desc: 'Căng tin phục vụ' },
        { icon: 'Shirt', label: 'Phòng thay đồ', desc: 'Sạch sẽ thoáng mát' },
      ],
      rules: [
        'Giữ gìn tư trang cá nhân cẩn thận.',
        'Sử dụng đúng trang phục thể thao và giày đinh phù hợp.',
        'Nghiêm cấm các hành vi bạo lực trên sân.',
      ],
      reviews: field.reviews.map((rev) => ({
        id: rev.id,
        author: rev.profiles.full_name || 'Khách hàng',
        avatar: rev.profiles.avatar_path || '',
        date: rev.created_at.toISOString(),
        rating: rev.rating,
        content: rev.content,
        verified: true,
      })),
    };
  }

  async findFieldTypes() {
    return this.prisma.field_types.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
