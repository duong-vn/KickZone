import { IsISO8601, IsString, IsUUID, MaxLength } from 'class-validator';

export class ValidateVoucherDto {
  @IsUUID()
  fieldId!: string;

  @IsISO8601()
  startTime!: string;

  @IsISO8601()
  endTime!: string;

  @IsString()
  @MaxLength(100)
  code!: string;
}
