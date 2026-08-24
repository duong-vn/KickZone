import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ValidateVoucherDto } from './dto/validate-voucher.dto';

export interface VoucherValidationResult {
  valid: boolean;
  message: string;
  code?: string;
  discountType?: 'PERCENT' | 'FIXED';
  discountValue?: number;
  discountAmount?: number;
  finalPrice?: number;
}

@Injectable()
export class VouchersService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(dto: ValidateVoucherDto): Promise<VoucherValidationResult> {
    const code = (dto.code || '').trim().toUpperCase();
    const originalPrice = Number(dto.originalPrice) || 0;

    if (!code) {
      return {
        valid: false,
        message: 'Vui lòng nhập mã giảm giá.',
      };
    }

    const voucher = await this.prisma.vouchers.findUnique({
      where: { code },
    });

    if (!voucher || !voucher.is_active) {
      return {
        valid: false,
        message: 'Mã giảm giá không tồn tại hoặc đã hết hạn sử dụng.',
      };
    }

    const now = new Date();
    if (voucher.start_at && now < new Date(voucher.start_at)) {
      return {
        valid: false,
        message: 'Mã giảm giá chưa đến thời gian áp dụng.',
      };
    }

    if (voucher.end_at && now > new Date(voucher.end_at)) {
      return {
        valid: false,
        message: 'Mã giảm giá đã hết hạn sử dụng.',
      };
    }

    if (voucher.min_order_value && originalPrice < voucher.min_order_value) {
      return {
        valid: false,
        message: `Mã giảm giá chỉ áp dụng cho đơn đặt sân từ ${voucher.min_order_value.toLocaleString('vi-VN')}đ trở lên.`,
      };
    }

    let discountAmount = 0;
    if (voucher.discount_type === 'FIXED') {
      discountAmount = Math.min(voucher.value, originalPrice);
    } else if (voucher.discount_type === 'PERCENT') {
      const calculated = Math.floor((originalPrice * voucher.value) / 100);
      discountAmount = voucher.max_discount
        ? Math.min(calculated, voucher.max_discount)
        : Math.min(calculated, originalPrice);
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    return {
      valid: true,
      message: 'Áp dụng mã giảm giá thành công!',
      code: voucher.code,
      discountType: voucher.discount_type,
      discountValue: voucher.value,
      discountAmount,
      finalPrice,
    };
  }
}
