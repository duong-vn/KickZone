import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOperatingHourDto {
  @ApiProperty({
    description: '0 = Sunday, 1 = Monday, ..., 6 = Saturday',
    example: 1,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiPropertyOptional({ example: '06:00' })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'openTime phải theo định dạng HH:mm',
  })
  openTime?: string;

  @ApiPropertyOptional({ example: '22:00' })
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'closeTime phải theo định dạng HH:mm',
  })
  closeTime?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;
}

export class CreatePriceRuleDto {
  @ApiProperty({ example: 'Khung giờ vàng tối' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: '0 = Sunday, ..., 6 = Saturday',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiProperty({ example: '17:00' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime phải theo định dạng HH:mm',
  })
  startTime!: string;

  @ApiProperty({ example: '22:00' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime phải theo định dạng HH:mm',
  })
  endTime!: string;

  @ApiProperty({
    example: 300000,
    description: 'Giá/giờ (VND) phải chia hết cho 2',
  })
  @IsInt()
  @Min(0)
  pricePerHour!: number;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsString()
  effectiveTo?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateFieldDto {
  @ApiProperty({ example: 'Sân bóng Chảo Lửa 1' })
  @IsString()
  @IsNotEmpty({ message: 'Tên sân không được để trống' })
  name!: string;

  @ApiPropertyOptional({ example: 'san-bong-chao-lua-1' })
  @IsOptional()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug phải ở định dạng url-friendly (chữ thường, số và gạch nối)',
  })
  slug?: string;

  @ApiProperty({ example: 'e7b1a23c-4567-89ab-cdef-0123456789ab' })
  @IsUUID('4', { message: 'fieldTypeId phải là UUID hợp lệ' })
  @IsNotEmpty()
  fieldTypeId!: string;

  @ApiPropertyOptional({
    example: 'Sân cỏ nhân tạo chuẩn FIFA 5 người thoáng mát',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '30 Phan Thúc Duyện, Phường 4' })
  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  address!: string;

  @ApiProperty({ example: 'Hồ Chí Minh' })
  @IsString()
  @IsNotEmpty({ message: 'Thành phố không được để trống' })
  city!: string;

  @ApiProperty({ example: 'Tân Bình' })
  @IsString()
  @IsNotEmpty({ message: 'Quận/Huyện không được để trống' })
  district!: string;

  @ApiPropertyOptional({ example: 10.798123 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 106.662345 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiProperty({
    example: 250000,
    description: 'Giá cơ bản/giờ (VND, chia hết cho 2)',
  })
  @IsInt()
  @Min(0, { message: 'Giá cơ bản phải >= 0' })
  basePricePerHour!: number;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';

  @ApiPropertyOptional({ type: [CreateOperatingHourDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOperatingHourDto)
  operatingHours?: CreateOperatingHourDto[];

  @ApiPropertyOptional({ type: [CreatePriceRuleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePriceRuleDto)
  priceRules?: CreatePriceRuleDto[];
}
