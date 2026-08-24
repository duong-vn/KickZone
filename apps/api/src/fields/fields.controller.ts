import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';

import { FieldsService } from './fields.service.js';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { GetFieldsQueryDto } from './dto/get-fields-query.dto.js';
import { IsString } from 'class-validator';

export class AvailabilityQueryDto {
  @IsString()
  date!: string;
}

@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) { }

  @Get()
  @ApiOperation({
    summary:
      'Lấy danh sách sân bóng kèm tìm kiếm, lọc và phân trang (dành cho Guest)',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách sân thành công' })
  findAll(@Query() query: GetFieldsQueryDto) {
    return this.fieldsService.findAll(query);
  }

  @Get(':id/availability')
  availability(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: AvailabilityQueryDto,
  ) {
    return this.fieldsService.getAvailability(id, query.date);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.fieldsService.findOne(id);
  }
}
