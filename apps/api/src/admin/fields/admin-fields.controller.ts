import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { AdminFieldsService } from './admin-fields.service';
import { CreateFieldDto } from './dto/create-field.dto';

@ApiTags('Admin Fields')
@ApiBearerAuth()
@Controller('admin/fields')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminFieldsController {
  constructor(private readonly adminFieldsService: AdminFieldsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: Get all soccer fields' })
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminFieldsService.findAll({
      search,
      status,
      type,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: Get soccer field details by ID' })
  findOne(@Param('id') id: string) {
    return this.adminFieldsService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary:
      'Admin: Create a new soccer field with operating hours and price rules',
  })
  createField(@Body() dto: CreateFieldDto) {
    return this.adminFieldsService.createField(dto);
  }

  @Post(':id/images')
  @ApiOperation({
    summary:
      'Admin: Upload multiple images for a soccer field to Supabase Storage',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('images', 10))
  uploadImages(
    @Param('id') fieldId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.adminFieldsService.uploadFieldImages(fieldId, files);
  }

  @Patch(':id/images/:imageId/primary')
  @ApiOperation({ summary: 'Admin: Set a field image as primary' })
  setPrimaryImage(
    @Param('id') fieldId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.adminFieldsService.setPrimaryImage(fieldId, imageId);
  }

  @Delete(':id/images/:imageId')
  @ApiOperation({ summary: 'Admin: Delete a field image' })
  deleteImage(@Param('id') fieldId: string, @Param('imageId') imageId: string) {
    return this.adminFieldsService.deleteFieldImage(fieldId, imageId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin: Update field active/inactive status' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'ACTIVE' | 'INACTIVE' },
  ) {
    return this.adminFieldsService.updateStatus(id, body.status);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: Update soccer field details' })
  updateField(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      address?: string;
      district?: string;
      city?: string;
      basePricePerHour?: number;
      description?: string;
      status?: 'ACTIVE' | 'INACTIVE';
      fieldTypeId?: string;
    },
  ) {
    return this.adminFieldsService.updateField(id, body);
  }

  @Get(':id/schedule')
  @ApiOperation({
    summary: 'Admin: Get schedule for a field on a specific date',
  })
  getFieldSchedule(@Param('id') id: string, @Query('date') date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.adminFieldsService.getFieldSchedule(id, targetDate);
  }

  @Get(':id/price-rules')
  @ApiOperation({ summary: 'Admin: Get all price rules for a field' })
  findPriceRules(@Param('id') fieldId: string) {
    return this.adminFieldsService.findPriceRules(fieldId);
  }

  @Post(':id/price-rules')
  @ApiOperation({ summary: 'Admin: Create a new price rule for a field' })
  createPriceRule(
    @Param('id') fieldId: string,
    @Body()
    body: {
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
    return this.adminFieldsService.createPriceRule(fieldId, body);
  }

  @Patch(':id/price-rules/:ruleId')
  @ApiOperation({ summary: 'Admin: Update a price rule for a field' })
  updatePriceRule(
    @Param('id') fieldId: string,
    @Param('ruleId') ruleId: string,
    @Body()
    body: {
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
    return this.adminFieldsService.updatePriceRule(fieldId, ruleId, body);
  }

  @Delete(':id/price-rules/:ruleId')
  @ApiOperation({ summary: 'Admin: Delete a price rule for a field' })
  deletePriceRule(
    @Param('id') fieldId: string,
    @Param('ruleId') ruleId: string,
  ) {
    return this.adminFieldsService.deletePriceRule(fieldId, ruleId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Admin: Soft delete a soccer field' })
  deleteField(@Param('id') id: string) {
    return this.adminFieldsService.deleteField(id);
  }
}
