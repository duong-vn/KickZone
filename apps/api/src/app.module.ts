import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FieldsController } from './fields/fields.controller';
import { FieldsService } from './fields/fields.service';
import { PrismaService } from '../prisma/prisma.service';

import { AuthModule } from './auth/auth.module';
import { FavoritesModule } from './favorites/favorites.module';

@Module({
  imports: [ScheduleModule.forRoot(), AuthModule, FavoritesModule],
  controllers: [AppController, FieldsController],
  providers: [AppService, FieldsService, PrismaService],
})
export class AppModule {}
