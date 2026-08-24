import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@ValidatorConstraint({ name: 'isComplexPassword', async: false })
export class IsComplexPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string) {
    if (!password || password.length < 8) return false;

    let passedCount = 0;
    if (/[a-z]/.test(password)) passedCount++;
    if (/[A-Z]/.test(password)) passedCount++;
    if (/[0-9]/.test(password)) passedCount++;
    if (/[^a-zA-Z0-9]/.test(password)) passedCount++;

    return passedCount >= 3;
  }

  defaultMessage() {
    return 'Mật khẩu phải có ít nhất 8 ký tự và thỏa mãn ít nhất 3 trong 4 tiêu chuẩn: chữ thường, chữ hoa, chữ số, ký tự đặc biệt';
  }
}

export class CreateUserDto {
  @ApiProperty({ example: 'nguyenvana@gmail.com' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email!: string;

  @ApiProperty({
    example: 'KickZone@2026',
    description:
      'Tối thiểu 8 ký tự, 3 trong 4 tiêu chuẩn (hoa, thường, số, ký tự đặc biệt)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(8, { message: 'Mật khẩu phải có tối thiểu 8 ký tự' })
  @Validate(IsComplexPasswordConstraint)
  password!: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  fullName!: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: ['USER', 'ADMIN'], default: 'USER' })
  @IsOptional()
  @IsEnum(['USER', 'ADMIN'], {
    message: 'Vai trò chỉ có thể là USER hoặc ADMIN',
  })
  role?: 'USER' | 'ADMIN';

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'], {
    message: 'Trạng thái chỉ có thể là ACTIVE hoặc INACTIVE',
  })
  status?: 'ACTIVE' | 'INACTIVE';
}
