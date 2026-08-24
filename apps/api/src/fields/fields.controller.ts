import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetFieldReviewsQueryDto } from './dto/get-field-reviews-query.dto';
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

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy thông tin chi tiết một sân bóng theo ID (dành cho Guest)',
  })
  @ApiParam({ name: 'id', description: 'ID của sân bóng (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin chi tiết sân thành công',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sân bóng' })
  findOne(@Param('id') id: string) {
    return this.fieldsService.findOne(id);
  }

  @Get(':id/reviews')
  @ApiOperation({
    summary: 'Lấy danh sách đánh giá của sân bóng theo ID',
  })
  @ApiParam({ name: 'id', description: 'ID của sân bóng (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách đánh giá của sân thành công',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sân bóng' })
  findReviews(
    @Param('id') id: string,
    @Query() query: GetFieldReviewsQueryDto,
  ) {
    return this.fieldsService.findReviews(id, query);
  }
}
