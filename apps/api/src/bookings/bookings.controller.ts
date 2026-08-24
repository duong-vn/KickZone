import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentProfile } from '../auth/current-profile.decorator.js';
import {
  SupabaseAuthGuard,
  type AuthenticatedProfile,
} from '../auth/supabase-auth.guard.js';
import { BookingsService } from './bookings.service.js';
import { CancelBookingDto } from './dto/cancel-booking.dto.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { ListBookingsDto } from './dto/list-bookings.dto.js';

@Controller('bookings')
@UseGuards(SupabaseAuthGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  create(
    @Body() dto: CreateBookingDto,
    @CurrentProfile() profile: AuthenticatedProfile,
  ) {
    return this.bookings.create(dto, profile);
  }

  @Get('me')
  findMine(
    @Query() query: ListBookingsDto,
    @CurrentProfile() profile: AuthenticatedProfile,
  ) {
    return this.bookings.findMine(profile, query);
  }

  @Get(':id')
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentProfile() profile: AuthenticatedProfile,
  ) {
    return this.bookings.findOne(id, profile);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CancelBookingDto,
    @CurrentProfile() profile: AuthenticatedProfile,
  ) {
    return this.bookings.cancel(id, dto, profile);
  }
}
