import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'Họ và tên của người dùng',
    example: 'Nguyễn Văn A',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Số điện thoại di động Việt Nam',
    example: '0912345678',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/, {
    message: 'Số điện thoại không đúng định dạng số di động Việt Nam',
  })
  phone?: string;
}
