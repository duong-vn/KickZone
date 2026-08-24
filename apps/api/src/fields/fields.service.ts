import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GetFieldsQueryDto } from './fields.controller';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 9;
const MAX_LIMIT = 100;

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  max?: number,
) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return max ? Math.min(parsed, max) : parsed;
}

function parsePrice(value: string | undefined) {
  const parsed = Number(value);

  return value && Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

@Injectable()
export class FieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetFieldsQueryDto) {
    const page = parsePositiveInteger(query.page, DEFAULT_PAGE);
    const limit = parsePositiveInteger(query.limit, DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;
    const minPrice = parsePrice(query.minPrice);
    const maxPrice = parsePrice(query.maxPrice);
    const where: Prisma.fieldsWhereInput = {
      deleted_at: null,
      status: 'ACTIVE',
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.district && query.district !== 'Tất cả quận/huyện') {
      where.district = {
        equals: query.district,
        mode: 'insensitive',
      };
    }

    if (query.type) {
      where.field_types = {
        name: { equals: query.type, mode: 'insensitive' },
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.base_price_per_hour = {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.fields.findMany({
        where,
        include: {
          field_types: true,
          field_images: true,
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.fields.count({ where }),
    ]);

    return {
      data: data.map((f) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        description: f.description,
        address: f.address,
        city: f.city,
        district: f.district,
        latitude: f.latitude ? Number(f.latitude) : null,
        longitude: f.longitude ? Number(f.longitude) : null,
        base_price_per_hour: f.base_price_per_hour,
        status: f.status,
        field_type: f.field_types?.name,
        field_type_id: f.field_type_id,
        primary_image_url:
          f.field_images?.storage_path ||
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&auto=format&fit=crop&q=80',
        rating_avg: 4.8,
        reviews_count: 0,
        is_available_today: true,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
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
