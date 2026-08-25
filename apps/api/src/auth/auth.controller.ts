import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PasswordResetService } from './password-reset.service';
import { OAuthService } from './oauth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { FacebookLoginDto } from './dto/facebook-login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly passwordResetService: PasswordResetService,
    private readonly oAuthService: OAuthService,
  ) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đăng nhập hoặc đăng ký nhanh qua Google',
    description:
      'Nhận ID Token hoặc Access Token từ Google, xác thực tài khoản và tự động tạo hồ sơ nếu là người dùng mới.',
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập Google thành công.',
  })
  @ApiResponse({
    status: 400,
    description: 'Thiếu thông tin xác thực từ Google.',
  })
  @ApiResponse({
    status: 401,
    description: 'Mã xác thực Google không hợp lệ hoặc hết hạn.',
  })
  async loginWithGoogle(@Body() dto: GoogleLoginDto) {
    return this.oAuthService.loginWithGoogle(dto);
  }

  @Post('facebook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đăng nhập hoặc đăng ký nhanh qua Facebook',
    description:
      'Nhận Access Token từ Facebook, xác thực tài khoản và tự động tạo hồ sơ nếu là người dùng mới.',
  })
  @ApiResponse({
    status: 200,
    description: 'Đăng nhập Facebook thành công.',
  })
  @ApiResponse({
    status: 400,
    description: 'Thiếu thông tin xác thực từ Facebook.',
  })
  @ApiResponse({
    status: 401,
    description: 'Mã xác thực Facebook không hợp lệ hoặc hết hạn.',
  })
  async loginWithFacebook(@Body() dto: FacebookLoginDto) {
    return this.oAuthService.loginWithFacebook(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Yêu cầu gửi liên kết khôi phục mật khẩu qua email',
    description:
      'Nhận email, kiểm tra tài khoản, sinh mã xác thực (hạn 15 phút) và gửi email khôi phục. Áp dụng giới hạn tần suất gửi.',
  })
  @ApiResponse({
    status: 200,
    description: 'Yêu cầu khôi phục mật khẩu đã được tiếp nhận và xử lý.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example:
            'Liên kết khôi phục mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc tài khoản bị vô hiệu hóa.',
  })
  @ApiResponse({
    status: 429,
    description: 'Thao tác quá nhanh, cần chờ theo thời gian quy định.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordResetService.handleForgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Thiết lập mật khẩu mới bằng mã xác thực từ email',
    description:
      'Nhận mã xác thực và mật khẩu mới, kiểm tra tính hợp lệ và thời hạn của mã, cập nhật mật khẩu và hủy hiệu lực của mã.',
  })
  @ApiResponse({
    status: 200,
    description: 'Mật khẩu đã được thiết lập thành công.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Mật khẩu của bạn đã được cập nhật thành công.',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Mã xác thực không hợp lệ, đã hết hạn hoặc mật khẩu không đủ mạnh.',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordResetService.handleResetPassword(
      dto.token,
      dto.password,
    );
  }
}
