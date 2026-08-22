import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class FieldsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    search?: string;
    type?: string;
    district?: string;
    minPrice?: string;
    maxPrice?: string;
    date?: string;
    page?: string;
    limit?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 9;
    const skip = (page - 1) * limit;

    const where: Prisma.fieldsWhereInput = {
      status: 'ACTIVE',
      deleted_at: null,
    };

    if (query.search?.trim()) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
        { district: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.type) {
      where.field_types = {
        name: { equals: query.type.trim(), mode: 'insensitive' },
      };
    }

    if (query.district?.trim() && query.district !== 'Tất cả quận/huyện') {
      where.district = {
        equals: query.district.trim(),
        mode: 'insensitive',
      };
    }

    if (query.minPrice || query.maxPrice) {
      where.base_price_per_hour = {};
      if (query.minPrice) where.base_price_per_hour.gte = Number(query.minPrice);
      if (query.maxPrice) where.base_price_per_hour.lte = Number(query.maxPrice);
    }

    const [data, total] = await Promise.all([
      this.prisma.field.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          field_types: true,
          field_images: true,
        },
      }),
      this.prisma.field.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}