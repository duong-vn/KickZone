import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseAuthGuard } from './auth/supabase-auth.guard.js';
import { SupabaseAuthService } from './auth/supabase-auth.service.js';
import { BookingsController } from './bookings/bookings.controller.js';
import { BookingsService } from './bookings/bookings.service.js';
import { EmailService } from './email/email.service.js';
import { FieldsController } from './fields/fields.controller.js';
import { FieldsService } from './fields/fields.service.js';
import { VouchersController } from './vouchers/vouchers.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [
    AppController,
    FieldsController,
    BookingsController,
    VouchersController,
  ],
  providers: [
    AppService,
    FieldsService,
    BookingsService,
    EmailService,
    PrismaService,
    SupabaseAuthService,
    SupabaseAuthGuard,
  ],
})
export class AppModule {}
