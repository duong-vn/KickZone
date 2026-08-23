import { Injectable } from '@nestjs/common';
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
    const where: Prisma.fieldsWhereInput = {};

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

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.base_price_per_hour = {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.fields.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.fields.count({ where }),
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
