import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Địa chỉ email tài khoản cần khôi phục mật khẩu',
    example: 'user@example.com',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsNotEmpty({ message: 'Vui lòng nhập địa chỉ email.' })
  @IsEmail({}, { message: 'Địa chỉ email không hợp lệ.' })
  email!: string;
}
