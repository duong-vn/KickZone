import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class ValidateVoucherDto {
  @ApiProperty({ description: 'Mã giảm giá', example: 'KICKZONE50' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Giá trị đơn hàng (VND)', example: 300000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  originalPrice: number;

  @ApiPropertyOptional({ description: 'ID sân bóng', example: 'uuid' })
  @IsOptional()
  @IsString()
  fieldId?: string;
}
