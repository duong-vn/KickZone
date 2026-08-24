import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { AdminBookingsModule } from './bookings/admin-bookings.module';
import { AdminDashboardModule } from './dashboard/admin-dashboard.module';
import { AdminFieldsController } from './fields/admin-fields.controller';
import { AdminFieldsService } from './fields/admin-fields.service';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';

@Module({
  imports: [
    AuthModule,
    StorageModule,
    AdminBookingsModule,
    AdminDashboardModule,
  ],
  controllers: [AdminFieldsController, AdminUsersController],
  providers: [AdminFieldsService, AdminUsersService, PrismaService],
  exports: [AdminFieldsService, AdminUsersService],
})
export class AdminModule {}
