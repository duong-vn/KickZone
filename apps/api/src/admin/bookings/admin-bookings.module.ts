import { Module } from '@nestjs/common';
import { AdminBookingsController } from './admin-bookings.controller';
import { AdminBookingsService } from './admin-bookings.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AdminBookingsController],
  providers: [AdminBookingsService],
  exports: [AdminBookingsService],
})
export class AdminBookingsModule {}
