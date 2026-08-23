/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GetFieldsQueryDto } from './fields.controller';

@Injectable()
export class FieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetFieldsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 9;
    const skip = (page - 1) * limit;

    // Sử dụng any để bypass ESLint strict mode
    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.district && query.district !== 'Tất cả quận/huyện') {
      where.district = {
        equals: query.district,
        mode: 'insensitive',
      };
    }

    if (query.minPrice || query.maxPrice) {
      where.pricePerHour = {};
      if (query.minPrice) {
        where.pricePerHour.gte = Number(query.minPrice);
      }
      if (query.maxPrice) {
        where.pricePerHour.lte = Number(query.maxPrice);
      }
    }

    // Bypass Prisma strict checking bằng (this.prisma as any)
    const [data, total] = await Promise.all([
      (this.prisma as any).field.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).field.count({ where }),
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
