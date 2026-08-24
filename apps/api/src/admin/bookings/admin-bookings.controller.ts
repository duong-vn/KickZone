import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminBookingsService } from './admin-bookings.service';
import {
  QueryAdminBookingsDto,
  RejectBookingDto,
} from './dto/query-bookings.dto';
import { AuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { user_role } from '../../generated/prisma/client';

@Controller('admin/bookings')
@UseGuards(AuthGuard, RolesGuard)
@Roles(user_role.ADMIN)
export class AdminBookingsController {
  constructor(private readonly bookingsService: AdminBookingsService) {}

  @Get()
  findAll(@Query() query: QueryAdminBookingsDto) {
    return this.bookingsService.findAll(query);
  }

  @Get('calendar')
  getCalendar(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('fieldId') fieldId?: string,
  ) {
    return this.bookingsService.getCalendar(from, to, fieldId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.bookingsService.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectBookingDto) {
    return this.bookingsService.reject(id, dto);
  }
}
