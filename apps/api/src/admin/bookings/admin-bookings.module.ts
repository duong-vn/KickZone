import { Module } from '@nestjs/common';
import { AdminBookingsController } from './admin-bookings.controller';
import { AdminBookingsService } from './admin-bookings.service';
import { AuthModule } from '../../auth/auth.module';
import { EmailService } from '../../email/email.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminBookingsController],
  providers: [AdminBookingsService, EmailService],
  exports: [AdminBookingsService],
})
export class AdminBookingsModule {}
