import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class ValidateVoucherDto {
  @ApiProperty({ description: 'Mã giảm giá', example: 'KICKZONE50' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code!: string;

  @ApiPropertyOptional({
    description: 'Giá trị đơn hàng (VND)',
    example: 300000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  originalPrice?: number;

  @ApiPropertyOptional({ description: 'ID sân bóng (UUID)', example: 'uuid' })
  @IsOptional()
  @IsUUID()
  fieldId?: string;

  @ApiPropertyOptional({
    description: 'Thời gian bắt đầu (ISO 8601)',
    example: '2026-08-26T18:00:00+07:00',
  })
  @IsOptional()
  @IsISO8601()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Thời gian kết thúc (ISO 8601)',
    example: '2026-08-26T19:30:00+07:00',
  })
  @IsOptional()
  @IsISO8601()
  endTime?: string;
}
