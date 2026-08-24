import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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
              field_images: true,
              field_types: true,
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
      data: items.map((fav) => ({
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
          city: fav.fields.city,
          district: fav.fields.district,
          base_price_per_hour: fav.fields.base_price_per_hour,
          status: fav.fields.status,
          field_type: fav.fields.field_types?.name,
          field_type_id: fav.fields.field_type_id,
          image_url: fav.fields.field_images?.storage_path,
        },
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
