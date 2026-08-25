import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateVoucherDto,
  ListVouchersQueryDto,
  UpdateVoucherDto,
} from './dto/voucher.dto';

const CONSUMING_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED'] as const;

@Injectable()
export class AdminVouchersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListVouchersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const now = new Date();
    const where: Prisma.vouchersWhereInput = {};

    if (query.search?.trim()) {
      where.code = { contains: query.search.trim(), mode: 'insensitive' };
    }
    if (query.type && query.type !== 'all') where.discount_type = query.type;
    if (query.status === 'active') {
      where.is_active = true;
      where.AND = [
        { OR: [{ start_at: null }, { start_at: { lte: now } }] },
        { OR: [{ end_at: null }, { end_at: { gt: now } }] },
      ];
    } else if (query.status === 'inactive') {
      where.is_active = false;
    } else if (query.status === 'expired') {
      where.end_at = { lte: now };
    } else if (query.status === 'scheduled') {
      where.is_active = true;
      where.start_at = { gt: now };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.vouchers.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          voucher_usages: {
            where: { bookings: { status: { in: [...CONSUMING_STATUSES] } } },
            select: { id: true },
          },
        },
      }),
      this.prisma.vouchers.count({ where }),
    ]);

    return {
      data: items.map((voucher) => ({
        id: voucher.id,
        code: voucher.code,
        discountType: voucher.discount_type,
        value: voucher.value,
        maxDiscount: voucher.max_discount,
        minOrderValue: voucher.min_order_value,
        startAt: voucher.start_at,
        endAt: voucher.end_at,
        usageLimit: voucher.usage_limit,
        perUserLimit: voucher.per_user_limit,
        usageCount: voucher.voucher_usages.length,
        isActive: voucher.is_active,
        createdAt: voucher.created_at,
        updatedAt: voucher.updated_at,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(dto: CreateVoucherDto) {
    this.validateRules(dto);
    try {
      const voucher = await this.prisma.vouchers.create({
        data: {
          code: dto.code.trim().toUpperCase(),
          discount_type: dto.discountType,
          value: dto.value,
          max_discount: dto.maxDiscount ?? null,
          min_order_value: dto.minOrderValue ?? null,
          start_at: dto.startAt ? new Date(dto.startAt) : null,
          end_at: dto.endAt ? new Date(dto.endAt) : null,
          usage_limit: dto.usageLimit ?? null,
          per_user_limit: dto.perUserLimit ?? null,
          is_active: dto.isActive ?? true,
        },
      });
      return { data: voucher };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async update(id: string, dto: UpdateVoucherDto) {
    const current = await this.requireVoucher(id);
    const merged = {
      code: dto.code ?? current.code,
      discountType: dto.discountType ?? current.discount_type,
      value: dto.value ?? current.value,
      maxDiscount:
        dto.maxDiscount === undefined ? current.max_discount : dto.maxDiscount,
      minOrderValue:
        dto.minOrderValue === undefined
          ? current.min_order_value
          : dto.minOrderValue,
      startAt: dto.startAt === undefined ? current.start_at : dto.startAt,
      endAt: dto.endAt === undefined ? current.end_at : dto.endAt,
      usageLimit:
        dto.usageLimit === undefined ? current.usage_limit : dto.usageLimit,
      perUserLimit:
        dto.perUserLimit === undefined
          ? current.per_user_limit
          : dto.perUserLimit,
      isActive: dto.isActive ?? current.is_active,
    };
    this.validateRules(merged);
    try {
      const voucher = await this.prisma.vouchers.update({
        where: { id },
        data: this.toPrismaData(dto),
      });
      return { data: voucher };
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async setStatus(id: string, isActive: boolean) {
    await this.requireVoucher(id);
    const voucher = await this.prisma.vouchers.update({
      where: { id },
      data: { is_active: isActive },
    });
    return { data: voucher };
  }

  async deactivate(id: string) {
    return this.setStatus(id, false);
  }

  private async requireVoucher(id: string) {
    const voucher = await this.prisma.vouchers.findUnique({ where: { id } });
    if (!voucher) throw new NotFoundException('Không tìm thấy voucher.');
    return voucher;
  }

  private validateRules(dto: {
    discountType: 'PERCENT' | 'FIXED';
    value: number;
    startAt?: string | Date | null;
    endAt?: string | Date | null;
  }) {
    if (dto.discountType === 'PERCENT' && dto.value > 100) {
      throw new BadRequestException('Voucher phần trăm phải từ 1 đến 100%.');
    }
    const start = dto.startAt ? new Date(dto.startAt) : null;
    const end = dto.endAt ? new Date(dto.endAt) : null;
    if (
      (start && Number.isNaN(start.getTime())) ||
      (end && Number.isNaN(end.getTime()))
    ) {
      throw new BadRequestException('Thời gian áp dụng không hợp lệ.');
    }
    if (start && end && start >= end) {
      throw new BadRequestException(
        'Thời gian kết thúc phải sau thời gian bắt đầu.',
      );
    }
  }

  private toPrismaData(dto: CreateVoucherDto | UpdateVoucherDto) {
    return {
      ...(dto.code !== undefined && { code: dto.code.trim().toUpperCase() }),
      ...(dto.discountType !== undefined && {
        discount_type: dto.discountType,
      }),
      ...(dto.value !== undefined && { value: dto.value }),
      ...(dto.maxDiscount !== undefined && { max_discount: dto.maxDiscount }),
      ...(dto.minOrderValue !== undefined && {
        min_order_value: dto.minOrderValue,
      }),
      ...(dto.startAt !== undefined && {
        start_at: dto.startAt ? new Date(dto.startAt) : null,
      }),
      ...(dto.endAt !== undefined && {
        end_at: dto.endAt ? new Date(dto.endAt) : null,
      }),
      ...(dto.usageLimit !== undefined && { usage_limit: dto.usageLimit }),
      ...(dto.perUserLimit !== undefined && {
        per_user_limit: dto.perUserLimit,
      }),
      ...(dto.isActive !== undefined && { is_active: dto.isActive }),
    };
  }

  private handlePrismaError(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Mã voucher đã tồn tại.');
    }
    throw error;
  }
}
