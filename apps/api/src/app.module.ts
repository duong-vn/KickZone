import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { SupabaseAuthGuard } from './auth/supabase-auth.guard';
import { SupabaseAuthService } from './auth/supabase-auth.service';
import { BookingsController } from './bookings/bookings.controller';
import { BookingsService } from './bookings/bookings.service';
import { EmailService } from './email/email.service';
import { FavoritesModule } from './favorites/favorites.module';
import { FieldsController } from './fields/fields.controller';
import { FieldsService } from './fields/fields.service';
import { VouchersController } from './vouchers/vouchers.controller';
import { VouchersService } from './vouchers/vouchers.service';
import { PrismaService } from './prisma/prisma.service';
import { StorageModule } from './storage/storage.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    FavoritesModule,
    StorageModule,
    AdminModule,
  ],
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
    VouchersService,
    PrismaService,
    SupabaseAuthService,
    SupabaseAuthGuard,
  ],
})
export class AppModule {}
