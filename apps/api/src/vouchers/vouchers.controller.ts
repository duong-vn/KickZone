import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ValidateVoucherDto } from './dto/validate-voucher.dto';
import { VouchersService } from './vouchers.service';

@ApiTags('vouchers')
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Kiểm tra và tính toán giảm giá của voucher' })
  @ApiResponse({
    status: 200,
    description: 'Kết quả kiểm tra mã giảm giá',
  })
  validate(@Body() dto: ValidateVoucherDto) {
    return this.vouchersService.validate(dto);
  }
}
