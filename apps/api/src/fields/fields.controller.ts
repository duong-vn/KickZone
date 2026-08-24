import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetFieldsQueryDto } from './dto/get-fields-query.dto';
import { FieldsService } from './fields.service';

@ApiTags('fields')
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
