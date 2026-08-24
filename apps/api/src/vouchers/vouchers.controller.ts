import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentProfile } from '../auth/current-profile.decorator.js';
import {
  SupabaseAuthGuard,
  type AuthenticatedProfile,
} from '../auth/supabase-auth.guard.js';
import { BookingsService } from '../bookings/bookings.service.js';
import { ValidateVoucherDto } from './dto/validate-voucher.dto.js';

@Controller('vouchers')
@UseGuards(SupabaseAuthGuard)
export class VouchersController {
  constructor(private readonly bookings: BookingsService) {}

  @Post('validate')
  validate(
    @Body() dto: ValidateVoucherDto,
    @CurrentProfile() profile: AuthenticatedProfile,
  ) {
    return this.bookings.validateVoucher(dto, profile);
  }
}
