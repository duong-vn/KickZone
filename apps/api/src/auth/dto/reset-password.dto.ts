import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Mã xác thực đặt lại mật khẩu nhận được qua email',
    example: 'd9b1c7...',
  })
  @IsNotEmpty({ message: 'Mã xác thực không được để trống.' })
  @IsString({ message: 'Mã xác thực phải là chuỗi ký tự.' })
  token!: string;

  @ApiProperty({
    description: 'Mật khẩu mới (tối thiểu 8 ký tự, gồm ít nhất 3 trong 4 nhóm ký tự)',
    example: 'NewSecurePass123!',
  })
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu mới.' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự.' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' })
  password!: string;
}
