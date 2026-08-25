import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FacebookLoginDto {
  @ApiProperty({
    description: 'Facebook User Access Token được cấp từ Facebook Login SDK',
    required: false,
    example: 'EAABsbCS1iHgBA...',
  })
  @IsOptional()
  @IsString()
  accessToken?: string;

  @ApiProperty({
    description: 'Facebook Authorization Code',
    required: false,
  })
  @IsOptional()
  @IsString()
  code?: string;
}
