import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetActivitiesQueryDto {
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm (tên sân, mã đơn, mô tả)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo loại: ALL | BOOKING | REVIEW | FAVORITE',
    default: 'ALL',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Sắp xếp: newest | oldest',
    default: 'newest',
  })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Số trang (mặc định: 1)', default: '1' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Số mục mỗi trang (mặc định: 20)',
    default: '20',
  })
  @IsOptional()
  @IsString()
  limit?: string;
}
