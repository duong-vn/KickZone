import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FieldsService } from './fields.service';

export interface GetFieldsQueryDto {
  search?: string;
  type?: string;
  district?: string;
  minPrice?: string;
  maxPrice?: string;
  date?: string;
  timeSlot?: string;
  page?: string;
  limit?: string;
}

@ApiTags('Fields')
@Controller()
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Get('fields')
  @ApiOperation({
    summary: 'Public: Get list of active soccer fields with filters',
  })
  findAll(@Query() query: GetFieldsQueryDto) {
    return this.fieldsService.findAll(query);
  }

  @Get('fields/:id')
  @ApiOperation({ summary: 'Public: Get soccer field detail by ID or Slug' })
  findOne(@Param('id') id: string) {
    return this.fieldsService.findOne(id);
  }

  @Get('field-types')
  @ApiOperation({ summary: 'Public: Get all soccer field types' })
  findFieldTypes() {
    return this.fieldsService.findFieldTypes();
  }
}
