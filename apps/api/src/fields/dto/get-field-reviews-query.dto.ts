import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetFieldReviewsQueryDto {
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
    description: 'Số lượng đánh giá mỗi trang (tối đa 50)',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Lọc theo số sao đánh giá (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Sắp xếp đánh giá',
    enum: ['newest', 'oldest', 'highest', 'lowest'],
    default: 'newest',
  })
  @IsOptional()
  @IsIn(['newest', 'oldest', 'highest', 'lowest'])
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest' = 'newest';
}
