import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateReviewCommentDto {
  @ApiProperty({
    description: 'Nội dung bình luận hoặc phản hồi',
    example: 'Cảm ơn bạn đã phản hồi, sân sẽ chú ý cải thiện ánh sáng hơn!',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString({ message: 'Nội dung bình luận phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Vui lòng nhập nội dung bình luận' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1, { message: 'Nội dung bình luận không được để trống' })
  @MaxLength(1000, { message: 'Nội dung bình luận tối đa 1000 ký tự' })
  content!: string;

  @ApiPropertyOptional({
    description: 'ID của bình luận cha nếu là phản hồi (reply)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Parent ID phải là UUID hợp lệ' })
  parentId?: string;
}

export class UpdateReviewCommentDto {
  @ApiProperty({
    description: 'Nội dung bình luận mới',
    example: 'Nội dung đã được chỉnh sửa.',
    minLength: 1,
    maxLength: 1000,
  })
  @IsString({ message: 'Nội dung bình luận phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Vui lòng nhập nội dung bình luận' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1, { message: 'Nội dung bình luận không được để trống' })
  @MaxLength(1000, { message: 'Nội dung bình luận tối đa 1000 ký tự' })
  content!: string;
}
