import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { CreateFieldDto } from './dto/create-field.dto';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseTimeToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
  return date;
}

@Injectable()
export class AdminFieldsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async findAll(query?: {
    search?: string;
    status?: string;
    type?: string;
    page?: string;
    limit?: string;
  }) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.fieldsWhereInput = { deleted_at: null };

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { address: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query?.status) {
      where.status = query.status as 'ACTIVE' | 'INACTIVE';
    }

    if (query?.type) {
      where.field_types = {
        name: { contains: query.type, mode: 'insensitive' },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.fields.findMany({
        where,
        include: {
          field_types: true,
          field_images: true,
          price_rules: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.fields.count({ where }),
    ]);

    const data = await Promise.all(
      items.map(async (f) => {
        const firstImg = await this.prisma.field_images.findFirst({
          where: { field_id: f.id },
          orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }],
        });
        return {
          id: f.id,
          name: f.name,
          slug: f.slug,
          fieldTypeId: f.field_type_id,
          fieldType: f.field_types?.name,
          fieldTypeLabel:
            f.field_types?.name === '5-a-side'
              ? 'Sân 5 người'
              : f.field_types?.name === '7-a-side'
                ? 'Sân 7 người'
                : 'Sân 11 người',
          address: f.address,
          district: f.district,
          city: f.city,
          basePricePerHour: f.base_price_per_hour,
          rating: 4.8,
          reviewCount: 0,
          status: f.status,
          imageUrl:
            firstImg?.storage_path ||
            f.field_images?.[0]?.storage_path ||
            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&auto=format&fit=crop&q=60',
          description: f.description || '',
          createdAt: f.created_at.toISOString().split('T')[0],
        };
      }),
    );

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

  async findOne(id: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      );

    const where: Prisma.fieldsWhereInput = isUuid
      ? { id, deleted_at: null }
      : { slug: id, deleted_at: null };

    const field = await this.prisma.fields.findFirst({
      where,
      include: {
        field_types: true,
        field_images: true,
        field_operating_hours: {
          orderBy: { day_of_week: 'asc' },
        },
        price_rules: {
          orderBy: { priority: 'desc' },
        },
      },
    });

    if (!field) {
      throw new NotFoundException('Sân bóng không tồn tại');
    }

    const fieldImages = await this.prisma.field_images.findMany({
      where: { field_id: field.id },
      orderBy: [{ is_primary: 'desc' }, { sort_order: 'asc' }],
    });

    const imageUrl =
      fieldImages.length > 0
        ? fieldImages[0].storage_path
        : field.field_images?.[0]?.storage_path ||
          'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&auto=format&fit=crop&q=80';

    const images =
      fieldImages.length > 0
        ? fieldImages.map((img) => img.storage_path)
        : [imageUrl];

    return {
      id: field.id,
      name: field.name,
      slug: field.slug,
      fieldType: field.field_types?.name || '5-a-side',
      fieldTypeLabel:
        field.field_types?.name === '5-a-side'
          ? 'Sân 5 người'
          : field.field_types?.name === '7-a-side'
            ? 'Sân 7 người'
            : 'Sân 11 người',
      dimensions: '20m x 40m',
      status: field.status,
      address: field.address,
      district: field.district,
      city: field.city,
      basePricePerHour: field.base_price_per_hour,
      upcomingBookingsCount: 0,
      description: field.description || '',
      imageUrl,
      images,
      priceRules: field.price_rules.map((pr) => ({
        id: pr.id,
        fieldId: pr.field_id,
        name: pr.name,
        daysDisplay:
          pr.day_of_week !== null && pr.day_of_week !== undefined
            ? `Thứ ${pr.day_of_week + 1}`
            : 'Cả tuần',
        daysOfWeek:
          pr.day_of_week !== null && pr.day_of_week !== undefined
            ? [pr.day_of_week]
            : [1, 2, 3, 4, 5, 6, 0],
        startTime: pr.start_time.toISOString().substring(11, 16),
        endTime: pr.end_time.toISOString().substring(11, 16),
        pricePerHour: pr.price_per_hour,
        isActive: pr.is_active,
      })),
    };
  }

  async createField(dto: CreateFieldDto) {
    // 1. Business validation: Price divisible by 2 for 30-min billing
    if (dto.basePricePerHour % 2 !== 0) {
      throw new BadRequestException(
        'Giá cơ bản mỗi giờ phải là số chia hết cho 2 để phục vụ tính giá 30 phút',
      );
    }

    // 2. Check field type existence
    const fieldType = await this.prisma.field_types.findUnique({
      where: { id: dto.fieldTypeId },
    });
    if (!fieldType) {
      throw new NotFoundException('Loại sân bóng (fieldTypeId) không tồn tại');
    }

    // 3. Slug resolution and uniqueness check
    let slug = dto.slug || slugify(dto.name);
    if (!slug) {
      slug = `field-${Date.now()}`;
    }

    const existingSlug = await this.prisma.fields.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      if (dto.slug) {
        throw new ConflictException(
          `Đường dẫn slug "${dto.slug}" đã được sử dụng`,
        );
      }
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // 4. Validate price rules
    if (dto.priceRules && dto.priceRules.length > 0) {
      for (const rule of dto.priceRules) {
        if (rule.pricePerHour % 2 !== 0) {
          throw new BadRequestException(
            `Giá theo quy tắc "${rule.name}" phải chia hết cho 2`,
          );
        }
        if (rule.startTime >= rule.endTime) {
          throw new BadRequestException(
            `Quy tắc "${rule.name}": startTime (${rule.startTime}) phải nhỏ hơn endTime (${rule.endTime})`,
          );
        }
      }
    }

    // 5. Default 7-day operating hours if not provided
    const operatingHoursData =
      dto.operatingHours && dto.operatingHours.length > 0
        ? dto.operatingHours.map((oh) => ({
            day_of_week: oh.dayOfWeek,
            open_time: oh.isClosed
              ? null
              : parseTimeToDate(oh.openTime || '06:00'),
            close_time: oh.isClosed
              ? null
              : parseTimeToDate(oh.closeTime || '22:00'),
            is_closed: oh.isClosed ?? false,
          }))
        : Array.from({ length: 7 }, (_, i) => ({
            day_of_week: i,
            open_time: parseTimeToDate('06:00'),
            close_time: parseTimeToDate('22:00'),
            is_closed: false,
          }));

    // 6. Prisma Transaction
    return this.prisma.$transaction(async (tx) => {
      const field = await tx.fields.create({
        data: {
          name: dto.name,
          slug,
          field_type_id: dto.fieldTypeId,
          description: dto.description || null,
          address: dto.address,
          city: dto.city,
          district: dto.district,
          latitude: dto.latitude !== undefined ? dto.latitude : null,
          longitude: dto.longitude !== undefined ? dto.longitude : null,
          base_price_per_hour: dto.basePricePerHour,
          status: dto.status || 'ACTIVE',
        },
      });

      // Insert operating hours
      await tx.field_operating_hours.createMany({
        data: operatingHoursData.map((oh) => ({
          field_id: field.id,
          ...oh,
        })),
      });

      // Insert price rules if any
      if (dto.priceRules && dto.priceRules.length > 0) {
        await tx.price_rules.createMany({
          data: dto.priceRules.map((rule) => ({
            field_id: field.id,
            name: rule.name,
            day_of_week: rule.dayOfWeek !== undefined ? rule.dayOfWeek : null,
            start_time: parseTimeToDate(rule.startTime),
            end_time: parseTimeToDate(rule.endTime),
            price_per_hour: rule.pricePerHour,
            effective_from: rule.effectiveFrom
              ? new Date(rule.effectiveFrom)
              : null,
            effective_to: rule.effectiveTo ? new Date(rule.effectiveTo) : null,
            priority: rule.priority ?? 0,
            is_active: rule.isActive ?? true,
          })),
        });
      }

      return tx.fields.findUnique({
        where: { id: field.id },
        include: {
          field_types: true,
          field_operating_hours: {
            orderBy: { day_of_week: 'asc' },
          },
          price_rules: {
            orderBy: { priority: 'desc' },
          },
        },
      });
    });
  }

  async uploadFieldImages(fieldId: string, files: Express.Multer.File[]) {
    // 1. Verify field exists
    const field = await this.prisma.fields.findFirst({
      where: { id: fieldId, deleted_at: null },
    });
    if (!field) {
      throw new NotFoundException('Sân bóng không tồn tại hoặc đã bị xóa');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất một hình ảnh');
    }

    const ALLOWED_MIME_TYPES = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
    ];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    // 2. Validate all files
    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          `Định dạng file "${file.originalname}" không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WEBP.`,
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException(
          `File "${file.originalname}" vượt quá dung lượng tối đa cho phép (5MB).`,
        );
      }
    }

    // 3. Check existing primary image
    const existingImages = await this.prisma.field_images.findMany({
      where: { field_id: fieldId },
      orderBy: { sort_order: 'desc' },
    });
    const hasPrimary = existingImages.some((img) => img.is_primary);
    let currentMaxOrder =
      existingImages.length > 0 ? existingImages[0].sort_order : -1;

    const createdImages = [];

    // 4. Upload and persist
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const { storagePath, publicUrl } =
        await this.storageService.uploadFieldImage(file, fieldId);

      currentMaxOrder += 1;
      const isPrimary = !hasPrimary && i === 0;

      const record = await this.prisma.field_images.create({
        data: {
          field_id: fieldId,
          storage_path: publicUrl || storagePath,
          alt_text: field.name,
          sort_order: currentMaxOrder,
          is_primary: isPrimary,
        },
      });

      createdImages.push(record);
    }

    return createdImages;
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    const field = await this.prisma.fields.findUnique({ where: { id } });
    if (!field) {
      throw new NotFoundException('Sân bóng không tồn tại');
    }

    return this.prisma.fields.update({
      where: { id },
      data: { status },
    });
  }

  async updateField(
    id: string,
    data: {
      name?: string;
      address?: string;
      district?: string;
      city?: string;
      basePricePerHour?: number;
      description?: string;
      status?: 'ACTIVE' | 'INACTIVE';
    },
  ) {
    const field = await this.prisma.fields.findUnique({ where: { id } });
    if (!field) {
      throw new NotFoundException('Sân bóng không tồn tại');
    }

    if (
      data.basePricePerHour !== undefined &&
      data.basePricePerHour % 2 !== 0
    ) {
      throw new BadRequestException(
        'Giá cơ bản mỗi giờ phải là số chia hết cho 2 để phục vụ tính giá 30 phút',
      );
    }

    return this.prisma.fields.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.address && { address: data.address }),
        ...(data.district && { district: data.district }),
        ...(data.city && { city: data.city }),
        ...(data.basePricePerHour !== undefined && {
          base_price_per_hour: data.basePricePerHour,
        }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.status && { status: data.status }),
      },
    });
  }

  async deleteField(id: string) {
    const field = await this.prisma.fields.findFirst({
      where: { id, deleted_at: null },
    });
    if (!field) {
      throw new NotFoundException('Sân bóng không tồn tại hoặc đã bị xóa');
    }

    // Business rule: Check if field has blocking bookings (PENDING or future CONFIRMED)
    const now = new Date();
    const blockingBookings = await this.prisma.bookings.findMany({
      where: {
        field_id: id,
        OR: [
          { status: 'PENDING' },
          {
            status: 'CONFIRMED',
            start_time: { gte: now },
          },
        ],
      },
    });

    if (blockingBookings.length > 0) {
      throw new BadRequestException(
        'Không thể xóa sân bóng khi đang có đơn đặt đang chờ xử lý (PENDING) hoặc đã xác nhận trong tương lai (CONFIRMED).',
      );
    }

    // Soft delete
    return this.prisma.fields.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        status: 'INACTIVE',
      },
    });
  }

  async getFieldSchedule(id: string, dateStr: string) {
    const field = await this.prisma.fields.findFirst({
      where: { id, deleted_at: null },
      include: {
        field_operating_hours: true,
      },
    });
    if (!field) {
      throw new NotFoundException('Sân bóng không tồn tại hoặc đã bị xóa');
    }

    const targetDate = new Date(dateStr);
    const dayOfWeek = targetDate.getUTCDay(); // 0 is Sunday

    const opHour = field.field_operating_hours.find(
      (oh) => oh.day_of_week === dayOfWeek,
    );

    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

    const bookings = await this.prisma.bookings.findMany({
      where: {
        field_id: id,
        start_time: { gte: startOfDay, lte: endOfDay },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      include: {
        profiles: { select: { full_name: true, phone: true } },
      },
      orderBy: { start_time: 'asc' },
    });

    // Generate 30-minute slots between 06:00 and 22:00 (or operating hours)
    const openTimeStr = opHour?.open_time
      ? opHour.open_time.toISOString().substring(11, 16)
      : '06:00';
    const closeTimeStr = opHour?.close_time
      ? opHour.close_time.toISOString().substring(11, 16)
      : '22:00';

    const [openH, openM] = openTimeStr.split(':').map(Number);
    const [closeH, closeM] = closeTimeStr.split(':').map(Number);

    const slots: Array<{
      startTime: string;
      endTime: string;
      timeLabel: string;
      isAvailable: boolean;
      booking?: {
        id: string;
        code: string;
        customerName: string;
        customerPhone: string;
        status: string;
      };
    }> = [];

    let currentMinutes = openH * 60 + openM;
    const endMinutes = closeH * 60 + closeM;

    while (currentMinutes + 30 <= endMinutes) {
      const startH = Math.floor(currentMinutes / 60);
      const startMin = currentMinutes % 60;
      const endH = Math.floor((currentMinutes + 30) / 60);
      const endMin = (currentMinutes + 30) % 60;

      const formatTime = (h: number, m: number) =>
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      const slotStartStr = formatTime(startH, startMin);
      const slotEndStr = formatTime(endH, endMin);

      const slotStartTime = new Date(`${dateStr}T${slotStartStr}:00.000Z`);
      const slotEndTime = new Date(`${dateStr}T${slotEndStr}:00.000Z`);

      // Check overlap: newStart < existingEnd AND newEnd > existingStart
      const matchedBooking = bookings.find(
        (b) => slotStartTime < b.end_time && slotEndTime > b.start_time,
      );

      slots.push({
        startTime: slotStartStr,
        endTime: slotEndStr,
        timeLabel: `${slotStartStr} - ${slotEndStr}`,
        isAvailable: !matchedBooking && !opHour?.is_closed,
        booking: matchedBooking
          ? {
              id: matchedBooking.id,
              code: matchedBooking.code,
              customerName: matchedBooking.profiles.full_name || 'Khách hàng',
              customerPhone: matchedBooking.profiles.phone || '',
              status: matchedBooking.status,
            }
          : undefined,
      });

      currentMinutes += 30;
    }

    return {
      fieldId: field.id,
      fieldName: field.name,
      date: dateStr,
      isClosed: opHour?.is_closed ?? false,
      operatingHours: `${openTimeStr} - ${closeTimeStr}`,
      slots,
    };
  }

  async findPriceRules(fieldId: string) {
    const rules = await this.prisma.price_rules.findMany({
      where: { field_id: fieldId },
      orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
    });

    return rules.map((r) => ({
      id: r.id,
      fieldId: r.field_id,
      name: r.name,
      dayOfWeek: r.day_of_week,
      daysDisplay:
        r.day_of_week !== null && r.day_of_week !== undefined
          ? `Thứ ${r.day_of_week === 0 ? 'CN' : r.day_of_week + 1}`
          : 'Tất cả các ngày',
      daysOfWeek:
        r.day_of_week !== null && r.day_of_week !== undefined
          ? [r.day_of_week]
          : [1, 2, 3, 4, 5, 6, 0],
      startTime: r.start_time.toISOString().substring(11, 16),
      endTime: r.end_time.toISOString().substring(11, 16),
      pricePerHour: r.price_per_hour,
      effectiveFrom: r.effective_from
        ? r.effective_from.toISOString().split('T')[0]
        : null,
      effectiveTo: r.effective_to
        ? r.effective_to.toISOString().split('T')[0]
        : null,
      priority: r.priority,
      isActive: r.is_active,
    }));
  }

  async createPriceRule(
    fieldId: string,
    data: {
      name: string;
      dayOfWeek?: number;
      daysOfWeek?: number[];
      startTime: string;
      endTime: string;
      pricePerHour: number;
      effectiveFrom?: string;
      effectiveTo?: string;
      priority?: number;
      isActive?: boolean;
    },
  ) {
    if (data.pricePerHour % 2 !== 0) {
      throw new BadRequestException(
        'Giá mỗi giờ phải là số chia hết cho 2 để phục vụ tính giá 30 phút',
      );
    }

    if (data.startTime >= data.endTime) {
      throw new BadRequestException('Giờ bắt đầu phải nhỏ hơn giờ kết thúc');
    }

    return this.prisma.price_rules.create({
      data: {
        field_id: fieldId,
        name: data.name,
        day_of_week:
          data.dayOfWeek !== undefined
            ? data.dayOfWeek
            : data.daysOfWeek && data.daysOfWeek.length === 1
              ? data.daysOfWeek[0]
              : null,
        start_time: parseTimeToDate(data.startTime),
        end_time: parseTimeToDate(data.endTime),
        price_per_hour: data.pricePerHour,
        effective_from: data.effectiveFrom
          ? new Date(data.effectiveFrom)
          : null,
        effective_to: data.effectiveTo ? new Date(data.effectiveTo) : null,
        priority: data.priority ?? 0,
        is_active: data.isActive ?? true,
      },
    });
  }

  async updatePriceRule(
    fieldId: string,
    ruleId: string,
    data: {
      name?: string;
      dayOfWeek?: number;
      daysOfWeek?: number[];
      startTime?: string;
      endTime?: string;
      pricePerHour?: number;
      effectiveFrom?: string;
      effectiveTo?: string;
      priority?: number;
      isActive?: boolean;
    },
  ) {
    const existing = await this.prisma.price_rules.findFirst({
      where: { id: ruleId, field_id: fieldId },
    });
    if (!existing) {
      throw new NotFoundException('Quy tắc giá không tồn tại');
    }

    if (data.pricePerHour !== undefined && data.pricePerHour % 2 !== 0) {
      throw new BadRequestException(
        'Giá mỗi giờ phải là số chia hết cho 2 để phục vụ tính giá 30 phút',
      );
    }

    return this.prisma.price_rules.update({
      where: { id: ruleId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.dayOfWeek !== undefined && { day_of_week: data.dayOfWeek }),
        ...(data.startTime && { start_time: parseTimeToDate(data.startTime) }),
        ...(data.endTime && { end_time: parseTimeToDate(data.endTime) }),
        ...(data.pricePerHour !== undefined && {
          price_per_hour: data.pricePerHour,
        }),
        ...(data.effectiveFrom !== undefined && {
          effective_from: data.effectiveFrom
            ? new Date(data.effectiveFrom)
            : null,
        }),
        ...(data.effectiveTo !== undefined && {
          effective_to: data.effectiveTo ? new Date(data.effectiveTo) : null,
        }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.isActive !== undefined && { is_active: data.isActive }),
      },
    });
  }

  async deletePriceRule(fieldId: string, ruleId: string) {
    const existing = await this.prisma.price_rules.findFirst({
      where: { id: ruleId, field_id: fieldId },
    });
    if (!existing) {
      throw new NotFoundException('Quy tắc giá không tồn tại');
    }

    return this.prisma.price_rules.delete({
      where: { id: ruleId },
    });
  }

  async getFieldTypes() {
    return this.prisma.field_types.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
