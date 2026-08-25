import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Google ID Token (JWT) được trả về từ Google Sign-In SDK',
    required: false,
    example: 'eyJhbGciOiJSUzI1NiIs...',
  })
  @IsOptional()
  @IsString()
  idToken?: string;

  @ApiProperty({
    description: 'Google Access Token',
    required: false,
  })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiProperty({
    description: 'Google Authorization Code',
    required: false,
  })
  @IsOptional()
  @IsString()
  code?: string;
}
