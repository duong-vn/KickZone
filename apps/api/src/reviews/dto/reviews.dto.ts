import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Điểm đánh giá từ 1 đến 5 sao',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt({ message: 'Rating phải là số nguyên từ 1 đến 5' })
  @Min(1, { message: 'Rating tối thiểu là 1 sao' })
  @Max(5, { message: 'Rating tối đa là 5 sao' })
  rating!: number;

  @ApiProperty({
    description: 'Nội dung bài đánh giá',
    example: 'Mặt cỏ rất đẹp, hệ thống chiếu sáng tốt, nhân viên nhiệt tình.',
    minLength: 5,
    maxLength: 1000,
  })
  @IsString({ message: 'Nội dung đánh giá phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Vui lòng nhập nội dung đánh giá' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(5, { message: 'Nội dung đánh giá tối thiểu 5 ký tự' })
  @MaxLength(1000, { message: 'Nội dung đánh giá tối đa 1000 ký tự' })
  content!: string;

  @ApiPropertyOptional({
    description: 'ID của lượt đặt sân tương ứng (nếu có)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Booking ID không hợp lệ' })
  bookingId?: string;
}

export class UpdateReviewDto {
  @ApiPropertyOptional({
    description: 'Điểm đánh giá mới từ 1 đến 5 sao',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt({ message: 'Rating phải là số nguyên từ 1 đến 5' })
  @Min(1, { message: 'Rating tối thiểu là 1 sao' })
  @Max(5, { message: 'Rating tối đa là 5 sao' })
  rating?: number;

  @ApiPropertyOptional({
    description: 'Nội dung bài đánh giá mới',
    example: 'Chất lượng sân vẫn rất ổn định sau nhiều lần quay lại.',
    minLength: 5,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'Nội dung đánh giá phải là chuỗi ký tự' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(5, { message: 'Nội dung đánh giá tối thiểu 5 ký tự' })
  @MaxLength(1000, { message: 'Nội dung đánh giá tối đa 1000 ký tự' })
  content?: string;
}
