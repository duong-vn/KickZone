import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('field-types')
@Controller()
export class FieldTypesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('field-types')
  @ApiOperation({ summary: 'Get all soccer field types (Public)' })
  async getFieldTypes() {
    const data = await this.prisma.field_types.findMany({
      orderBy: { name: 'asc' },
    });
    return { data };
  }

  @Get('admin/field-types')
  @ApiOperation({ summary: 'Admin: Get all field types' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  async getAdminFieldTypes() {
    const data = await this.prisma.field_types.findMany({
      orderBy: { name: 'asc' },
    });
    return { data };
  }

  @Post('admin/field-types')
  @ApiOperation({ summary: 'Admin: Create a new field type' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  async createFieldType(
    @Body() body: { name: string; description?: string | null },
  ) {
    const name = body.name?.trim();
    if (!name) {
      throw new ConflictException('Tên loại sân không được để trống.');
    }

    const existing = await this.prisma.field_types.findUnique({
      where: { name },
    });
    if (existing) {
      throw new ConflictException(`Loại sân "${name}" đã tồn tại.`);
    }

    const data = await this.prisma.field_types.create({
      data: {
        name,
        description: body.description?.trim() || null,
      },
    });
    return { data };
  }

  @Patch('admin/field-types/:id')
  @ApiOperation({ summary: 'Admin: Update a field type' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  async updateFieldType(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string | null },
  ) {
    const existing = await this.prisma.field_types.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy loại sân.');
    }

    if (body.name) {
      const name = body.name.trim();
      const duplicate = await this.prisma.field_types.findFirst({
        where: { name, NOT: { id } },
      });
      if (duplicate) {
        throw new ConflictException(`Loại sân "${name}" đã tồn tại.`);
      }
    }

    const data = await this.prisma.field_types.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name.trim() }),
        ...(body.description !== undefined && {
          description: body.description?.trim() || null,
        }),
      },
    });
    return { data };
  }

  @Delete('admin/field-types/:id')
  @ApiOperation({ summary: 'Admin: Delete a field type' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  async deleteFieldType(@Param('id') id: string) {
    const existing = await this.prisma.field_types.findUnique({
      where: { id },
      include: { _count: { select: { fields: true } } },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy loại sân.');
    }

    if (existing._count.fields > 0) {
      throw new ConflictException(
        `Không thể xóa loại sân đang được gán cho ${existing._count.fields} sân bóng.`,
      );
    }

    await this.prisma.field_types.delete({
      where: { id },
    });
    return { success: true, message: 'Đã xóa loại sân thành công.' };
  }
}
