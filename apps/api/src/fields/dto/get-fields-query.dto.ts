import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class GetFieldsQueryDto {
  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm theo tên hoặc địa chỉ',
    example: 'Chảo Lửa',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Loại sân (có thể phân tách bằng dấu phẩy, vd: Sân 5,Sân 7)',
    example: 'Sân 5,Sân 7',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Tên loại sân (alias cho type)',
    example: 'Sân 5',
  })
  @IsOptional()
  @IsString()
  fieldType?: string;

  @ApiPropertyOptional({ description: 'Quận/Huyện', example: 'Tân Bình' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({
    description: 'Mức giá tối thiểu / giờ (VND)',
    example: 200000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Mức giá tối đa / giờ (VND)',
    example: 1000000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Ngày tìm kiếm (YYYY-MM-DD)',
    example: '2026-08-25',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Khung giờ đặt sân',
    example: '18:00 - 20:00',
  })
  @IsOptional()
  @IsString()
  timeSlot?: string;

  @ApiPropertyOptional({ description: 'Giờ bắt đầu (HH:mm)', example: '18:00' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Giờ kết thúc (HH:mm)',
    example: '20:00',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Tiêu chí sắp xếp',
    enum: ['featured', 'rating', 'price-asc', 'price-desc', 'newest'],
    default: 'featured',
  })
  @IsOptional()
  @IsIn(['featured', 'rating', 'price-asc', 'price-desc', 'newest'])
  sortBy?: 'featured' | 'rating' | 'price-asc' | 'price-desc' | 'newest';

  @ApiPropertyOptional({
    description: 'Số trang hiện tại (bắt đầu từ 1)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Số lượng sân mỗi trang (tối đa 100)',
    default: 9,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 9;
}
