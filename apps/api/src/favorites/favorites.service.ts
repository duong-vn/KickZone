import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ToggleFavoriteResult {
  is_favorite: boolean;
  message: string;
}

export interface FavoriteStatusResult {
  is_favorite: boolean;
}

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

function formatFieldTypeName(name?: string | null): string {
  if (!name) return 'Sân 7 người';
  if (name.includes('5')) return 'Sân 5 người';
  if (name.includes('7')) return 'Sân 7 người';
  if (name.includes('11')) return 'Sân 11 người';
  return name;
}

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async toggleFavorite(
    userId: string,
    fieldId: string,
  ): Promise<ToggleFavoriteResult> {
    // 1. Verify field existence and active status
    const field = await this.prisma.fields.findFirst({
      where: {
        id: fieldId,
        deleted_at: null,
      },
    });

    if (!field) {
      throw new NotFoundException('Sân bóng không tồn tại hoặc đã bị xóa');
    }

    // 2. Check if favorite record already exists
    const existingFavorite = await this.prisma.favorites.findUnique({
      where: {
        user_id_field_id: {
          user_id: userId,
          field_id: fieldId,
        },
      },
    });

    // 3. Toggle: remove if exists, insert if not
    if (existingFavorite) {
      await this.prisma.favorites.delete({
        where: {
          user_id_field_id: {
            user_id: userId,
            field_id: fieldId,
          },
        },
      });

      return {
        is_favorite: false,
        message: 'Đã xóa sân khỏi danh sách yêu thích',
      };
    }

    await this.prisma.favorites.create({
      data: {
        user_id: userId,
        field_id: fieldId,
      },
    });

    return {
      is_favorite: true,
      message: 'Đã thêm sân vào danh sách yêu thích',
    };
  }

  async getFavoriteStatus(
    userId: string,
    fieldId: string,
  ): Promise<FavoriteStatusResult> {
    const existing = await this.prisma.favorites.findUnique({
      where: {
        user_id_field_id: {
          user_id: userId,
          field_id: fieldId,
        },
      },
    });

    return {
      is_favorite: Boolean(existing),
    };
  }

  async getUserFavorites(
    userId: string,
    query?: { page?: string; limit?: string },
  ) {
    const page = parsePositiveInteger(query?.page, 1);
    const limit = parsePositiveInteger(query?.limit, 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.favorites.findMany({
        where: {
          user_id: userId,
          fields: { deleted_at: null },
        },
        include: {
          fields: {
            include: {
              field_images: {
                orderBy: [
                  { is_primary: 'desc' },
                  { sort_order: 'asc' },
                  { created_at: 'asc' },
                ],
                select: {
                  id: true,
                  storage_path: true,
                  alt_text: true,
                  is_primary: true,
                  sort_order: true,
                },
              },
              field_types: true,
              reviews: {
                select: {
                  rating: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.favorites.count({
        where: {
          user_id: userId,
          fields: { deleted_at: null },
        },
      }),
    ]);

    return {
      data: items.map((fav) => {
        const reviews = fav.fields.reviews ?? [];
        const reviewsCount = reviews.length;
        const ratingAvg =
          reviewsCount > 0
            ? Number(
                (
                  reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount
                ).toFixed(1),
              )
            : 0;

        const rawTypeName = fav.fields.field_types?.name ?? '7-a-side';
        const fieldTypeName = formatFieldTypeName(rawTypeName);

        const images = Array.isArray(fav.fields.field_images)
          ? fav.fields.field_images
          : fav.fields.field_images
            ? [fav.fields.field_images]
            : [];

        const primaryImg = images.find((img) => img.is_primary) ?? images[0];

        const imageUrl =
          primaryImg?.storage_path ||
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80';

        return {
          id: fav.id,
          user_id: fav.user_id,
          field_id: fav.field_id,
          created_at: fav.created_at.toISOString(),
          field: {
            id: fav.fields.id,
            name: fav.fields.name,
            slug: fav.fields.slug,
            description: fav.fields.description,
            address: fav.fields.address,
            location: fav.fields.address,
            city: fav.fields.city,
            district: fav.fields.district,
            base_price_per_hour: fav.fields.base_price_per_hour,
            basePricePerHour: fav.fields.base_price_per_hour,
            pricePerHour: fav.fields.base_price_per_hour,
            status: fav.fields.status,
            field_type: fav.fields.field_types?.name,
            field_types: fav.fields.field_types,
            field_type_id: fav.fields.field_type_id,
            type: fieldTypeName,
            types: [fieldTypeName],
            image: imageUrl,
            primary_image_url: imageUrl,
            image_url: imageUrl,
            field_images: images,
            rating: ratingAvg,
            rating_avg: ratingAvg,
            reviews_count: reviewsCount,
            available: true,
            is_available_today: true,
          },
        };
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
