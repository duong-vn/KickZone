import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FieldsController } from './fields/fields.controller';
import { FieldsService } from './fields/fields.service';
import { VouchersController } from './vouchers/vouchers.controller';
import { VouchersService } from './vouchers/vouchers.service';
import { PrismaService } from '../prisma/prisma.service';

import { AuthModule } from './auth/auth.module';
import { FavoritesModule } from './favorites/favorites.module';
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
  controllers: [AppController, FieldsController, VouchersController],
  providers: [AppService, FieldsService, VouchersService, PrismaService],
})
export class AppModule {}
