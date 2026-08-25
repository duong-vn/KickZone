import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateVoucherDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).trim().toUpperCase())
  code!: string;

  @IsEnum(['PERCENT', 'FIXED'])
  discountType!: 'PERCENT' | 'FIXED';

  @IsInt()
  @Min(1)
  value!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxDiscount?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderValue?: number | null;

  @IsOptional()
  @IsString()
  startAt?: string | null;

  @IsOptional()
  @IsString()
  endAt?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  perUserLimit?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateVoucherDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value).trim().toUpperCase())
  code?: string;

  @IsOptional()
  @IsEnum(['PERCENT', 'FIXED'])
  discountType?: 'PERCENT' | 'FIXED';

  @IsOptional()
  @IsInt()
  @Min(1)
  value?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxDiscount?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  minOrderValue?: number | null;

  @IsOptional()
  @IsString()
  startAt?: string | null;

  @IsOptional()
  @IsString()
  endAt?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  perUserLimit?: number | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ListVouchersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(['all', 'active', 'inactive', 'expired', 'scheduled'])
  status?: 'all' | 'active' | 'inactive' | 'expired' | 'scheduled';

  @IsOptional()
  @IsEnum(['all', 'PERCENT', 'FIXED'])
  type?: 'all' | 'PERCENT' | 'FIXED';

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class SetVoucherStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
